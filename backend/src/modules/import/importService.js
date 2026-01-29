const cheerio = require('cheerio');
const pool = require('../../shared/config/database');
const Page = require('../pages/pages.model');
const Section = require('../sections/sections.model');
const Group = require('../groups/groups.model');
const Bookmark = require('../bookmarks/bookmarks.model');
const faviconService = require('../../shared/services/faviconService');

/**
 * ImportService
 *
 * Service for importing bookmarks from HTML files (Chrome, Firefox, Safari)
 * Parses Netscape Bookmark Format and creates section + group + bookmarks
 */
class ImportService {
  /**
   * Parse HTML bookmarks file (Netscape format)
   * @param {string} htmlContent - HTML file content
   * @returns {Promise<Array>} - Array of parsed bookmarks {title, url, folder}
   */
  async parseHtmlBookmarks(htmlContent) {
    try {
      const $ = cheerio.load(htmlContent);
      const bookmarks = [];

      // Find all <DT><A> tags (bookmark entries)
      $('dt a').each((index, element) => {
        const $link = $(element);
        const href = $link.attr('href');
        const title = $link.text().trim();

        // Only add if both title and URL exist
        if (href && title) {
          // Get folder name (parent <H3> if exists)
          const $folder = $link.closest('dl').prev('dt').find('h3');
          const folder = $folder.length > 0 ? $folder.text().trim() : 'Imported';

          bookmarks.push({
            title: title,
            url: href,
            folder: folder
          });
        }
      });

      console.log(`📋 Parsed ${bookmarks.length} bookmarks from HTML`);
      return bookmarks;
    } catch (error) {
      console.error('Error parsing HTML bookmarks:', error.message);
      throw new Error('Failed to parse HTML bookmarks file. Please ensure it is a valid Netscape bookmark format.');
    }
  }

  /**
   * Import bookmarks to a specific group
   * Uses transaction for atomicity
   * @param {string} userId - User ID
   * @param {string} groupId - Group ID
   * @param {Array} bookmarks - Array of bookmarks to import
   * @returns {Promise<object>} - {success: number, skipped: number, failed: number}
   */
  async importBookmarksToGroup(userId, groupId, bookmarks) {
    let client;
    let success = 0, skipped = 0, failed = 0;

    try {
      client = await pool.connect();
      await client.query('BEGIN');

      for (const bm of bookmarks) {
        try {
          // Check if URL already exists in this group (duplicate detection)
          const existing = await Bookmark.findByUrl(groupId, bm.url);
          if (existing) {
            console.log(`⏭️ Skipping duplicate: ${bm.url}`);
            skipped++;
            continue;
          }

          // Fetch favicon automatically
          let faviconUrl;
          try {
            faviconUrl = await faviconService.getFavicon(bm.url);
          } catch (error) {
            console.warn(`⚠️ Favicon fetch failed for ${bm.url}, using default`);
            faviconUrl = faviconService.getDefaultIcon();
          }

          // Create bookmark
          await Bookmark.create(groupId, userId, {
            title: bm.title,
            url: bm.url,
            description: null,
            favicon_url: faviconUrl
          });

          success++;
          console.log(`✅ Imported: ${bm.title}`);
        } catch (error) {
          console.error(`❌ Failed to import bookmark: ${bm.url}`, error.message);
          failed++;
          // Continue with other bookmarks instead of failing entire import
        }
      }

      await client.query('COMMIT');
      console.log(`\n📊 Import completed: ${success} imported, ${skipped} skipped, ${failed} failed`);

      return { success, skipped, failed };
    } catch (error) {
      if (client) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError.message);
        }
      }
      console.error('❌ Import transaction failed:', error.message);
      throw new Error('Import failed. Transaction rolled back.');
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Main import method: Parse HTML and create section + group + bookmarks
   * @param {string} userId - User ID
   * @param {string} htmlContent - HTML file content
   * @returns {Promise<object>} - {section, group, imported, skipped, failed}
   */
  async importBookmarks(userId, htmlContent) {
    try {
      // 1. Parse HTML bookmarks
      console.log('\n🔍 Step 1: Parsing HTML...');
      const bookmarks = await this.parseHtmlBookmarks(htmlContent);

      if (bookmarks.length === 0) {
        throw new Error('No bookmarks found in the HTML file.');
      }

      // 2. Get user's first page (or create one if none exists)
      console.log('\n📄 Step 2: Getting target page...');
      const pages = await Page.findAllByUser(userId);

      if (pages.length === 0) {
        throw new Error('No pages found. Please create a page first before importing bookmarks.');
      }

      const targetPage = pages[0];
      console.log(`✅ Using page: ${targetPage.name}`);

      // 3. Create "Imported Bookmarks" section
      console.log('\n📦 Step 3: Creating import section...');
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      const section = await Section.create(targetPage.id, {
        name: `Imported Bookmarks - ${currentDate}`
      });
      console.log(`✅ Section created: ${section.name}`);

      // 4. Create "All Imported Bookmarks" group
      console.log('\n🗂️ Step 4: Creating group...');
      const group = await Group.create(section.id, {
        name: 'All Imported Bookmarks',
        column_count: 3,
        group_type: 'manual'
      });
      console.log(`✅ Group created: ${group.name}`);

      // 5. Import bookmarks to the group
      console.log('\n🔖 Step 5: Importing bookmarks...');
      const results = await this.importBookmarksToGroup(userId, group.id, bookmarks);

      return {
        section,
        group,
        imported: results.success,
        skipped: results.skipped,
        failed: results.failed
      };
    } catch (error) {
      console.error('❌ Import failed:', error.message);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new ImportService();
