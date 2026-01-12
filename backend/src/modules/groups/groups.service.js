const Group = require('./groups.model');
const Section = require('../sections/sections.model');

/**
 * Groups Service
 * Contient la business logic pour la gestion des groups
 */
class GroupsService {
  /**
   * Créer un nouveau group avec validation
   * @param {string} userId - UUID du user
   * @param {string} sectionId - UUID de la section parente
   * @param {object} groupData - { name, column_count?, group_type?, bookmark_limit? }
   * @returns {Promise<object>} Group créé
   * @throws {Error} Si validation échoue
   */
  async createGroup(userId, sectionId, groupData) {
    const { name, column_count = 3, group_type = 'manual', bookmark_limit, width = '100%' } = groupData;

    // Validation: sectionId requis
    if (!sectionId || sectionId.trim().length === 0) {
      throw new Error('Section ID is required');
    }

    // Validation: vérifier que la section existe et appartient au user (via page)
    const hasAccess = await Group.verifySectionOwnership(sectionId, userId);
    if (!hasAccess) {
      throw new Error('Section not found or access denied');
    }

    // Validation: name requis
    if (!name || name.trim().length === 0) {
      throw new Error('Group name is required');
    }

    // Validation: name max 100 caractères
    if (name.length > 100) {
      throw new Error('Group name must be 100 characters or less');
    }

    // Validation: nom unique par section (case-insensitive)
    const existing = await Group.findByName(sectionId, name);
    if (existing) {
      throw new Error(`Group with name "${name}" already exists in this section`);
    }

    // Validation: column_count entre 1 et 6
    if (column_count < 1 || column_count > 6) {
      throw new Error('Column count must be between 1 and 6');
    }

    // Validation: group_type valide
    if (group_type !== 'manual' && group_type !== 'dynamic-top-used') {
      throw new Error('Group type must be either "manual" or "dynamic-top-used"');
    }

    // Validation: bookmark_limit selon le type
    if (group_type === 'dynamic-top-used') {
      if (!bookmark_limit || bookmark_limit <= 0) {
        throw new Error('Bookmark limit is required and must be greater than 0 for dynamic groups');
      }
    } else {
      // Si manual, bookmark_limit doit être null
      if (bookmark_limit !== null && bookmark_limit !== undefined) {
        throw new Error('Bookmark limit should not be set for manual groups');
      }
    }

    // Créer le group
    const group = await Group.create(sectionId, {
      name: name.trim(),
      column_count,
      group_type,
      bookmark_limit: group_type === 'dynamic-top-used' ? bookmark_limit : null,
      width
    });

    return group;
  }

  /**
   * Récupérer tous les groups d'une section
   * @param {string} userId - UUID du user
   * @param {string} sectionId - UUID de la section
   * @returns {Promise<Array>} Liste des groups
   * @throws {Error} Si section non trouvée ou pas owned par user
   */
  async getSectionGroups(userId, sectionId) {
    // Vérifier que la section existe et appartient au user
    const hasAccess = await Group.verifySectionOwnership(sectionId, userId);
    if (!hasAccess) {
      throw new Error('Section not found or access denied');
    }

    return Group.findAllBySection(sectionId);
  }

  /**
   * Récupérer un group par ID
   * @param {string} groupId - UUID du group
   * @param {string} userId - UUID du user
   * @returns {Promise<object>} Group
   * @throws {Error} Si group non trouvé ou pas owned par user
   */
  async getGroupById(groupId, userId) {
    const group = await Group.findById(groupId, userId);

    if (!group) {
      throw new Error('Group not found or access denied');
    }

    return group;
  }

  /**
   * Mettre à jour un group avec validation
   * @param {string} groupId - UUID du group
   * @param {string} userId - UUID du user
   * @param {object} updates - { name?, column_count?, group_type?, bookmark_limit?, section_id? }
   * @returns {Promise<object>} Group mis à jour
   * @throws {Error} Si validation échoue ou group non trouvé
   */
  async updateGroup(groupId, userId, updates) {
    const { name, column_count, group_type, bookmark_limit, section_id, width } = updates;

    // Vérifier que le group existe et appartient au user (via section→page)
    const existing = await Group.findById(groupId, userId);
    if (!existing) {
      throw new Error('Group not found or access denied');
    }

    // Validation: section_id si fourni (pour déplacer vers une autre section)
    if (section_id !== undefined && section_id !== existing.section_id) {
      // Vérifier que la nouvelle section existe et appartient au user
      const hasAccess = await Group.verifySectionOwnership(section_id, userId);
      if (!hasAccess) {
        throw new Error('Target section not found or access denied');
      }

      // Vérifier unicité du nom dans la nouvelle section
      const duplicate = await Group.findByName(section_id, existing.name);
      if (duplicate) {
        throw new Error(`Group with name "${existing.name}" already exists in the target section`);
      }
    }

    // Validation: name si fourni
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        throw new Error('Group name cannot be empty');
      }

      if (name.length > 100) {
        throw new Error('Group name must be 100 characters or less');
      }

      // Vérifier unicité du nom dans la section (si différent du nom actuel)
      const targetSectionId = section_id || existing.section_id;
      if (name.trim().toLowerCase() !== existing.name.toLowerCase()) {
        const duplicate = await Group.findByName(targetSectionId, name);
        if (duplicate) {
          throw new Error(`Group with name "${name}" already exists in this section`);
        }
      }
    }

    // Validation: column_count si fourni
    if (column_count !== undefined) {
      if (column_count < 1 || column_count > 6) {
        throw new Error('Column count must be between 1 and 6');
      }
    }

    // Validation: group_type ne peut pas être modifié après création
    if (group_type !== undefined && group_type !== existing.group_type) {
      throw new Error('Group type cannot be changed after creation');
    }

    // Validation: bookmark_limit selon le type
    if (bookmark_limit !== undefined) {
      if (existing.group_type === 'dynamic-top-used') {
        if (bookmark_limit <= 0) {
          throw new Error('Bookmark limit must be greater than 0 for dynamic groups');
        }
      } else {
        throw new Error('Bookmark limit should not be set for manual groups');
      }
    }

    // Préparer les updates
    const validUpdates = {};
    if (name !== undefined) validUpdates.name = name.trim();
    if (column_count !== undefined) validUpdates.column_count = column_count;
    if (bookmark_limit !== undefined) validUpdates.bookmark_limit = bookmark_limit;
    if (section_id !== undefined) validUpdates.section_id = section_id;
    if (width !== undefined) validUpdates.width = width;

    // Si aucun update, retourner le group existant
    if (Object.keys(validUpdates).length === 0) {
      return existing;
    }

    // Mettre à jour
    const updated = await Group.update(groupId, userId, validUpdates);

    if (!updated) {
      throw new Error('Failed to update group');
    }

    return updated;
  }

  /**
   * Supprimer un group
   * @param {string} groupId - UUID du group
   * @param {string} userId - UUID du user
   * @returns {Promise<boolean>} True si supprimé
   * @throws {Error} Si group non trouvé
   */
  async deleteGroup(groupId, userId) {
    // Vérifier que le group existe et appartient au user
    const existing = await Group.findById(groupId, userId);
    if (!existing) {
      throw new Error('Group not found or access denied');
    }

    // TODO Itération 5: Gérer les bookmarks enfants
    // Pour l'instant, CASCADE supprimera automatiquement (défini dans migration)

    const deleted = await Group.delete(groupId, userId);

    if (!deleted) {
      throw new Error('Failed to delete group');
    }

    return true;
  }

  /**
   * Réorganiser les groups d'une section (drag & drop)
   * @param {string} userId - UUID du user
   * @param {string} sectionId - UUID de la section
   * @param {Array<string>} groupIds - Array d'UUIDs dans le nouvel ordre
   * @returns {Promise<Array>} Groups réordonnés
   * @throws {Error} Si validation échoue
   */
  async reorderGroups(userId, sectionId, groupIds) {
    // Validation: sectionId requis
    if (!sectionId || sectionId.trim().length === 0) {
      throw new Error('Section ID is required');
    }

    // Validation: vérifier que la section existe et appartient au user
    const hasAccess = await Group.verifySectionOwnership(sectionId, userId);
    if (!hasAccess) {
      throw new Error('Section not found or access denied');
    }

    // Validation: groupIds doit être un array
    if (!Array.isArray(groupIds)) {
      throw new Error('groupIds must be an array');
    }

    // Validation: pas d'IDs vides
    if (groupIds.some(id => !id || typeof id !== 'string')) {
      throw new Error('All groupIds must be valid strings');
    }

    // Validation: tous les groups appartiennent à cette section
    const sectionGroups = await Group.findAllBySection(sectionId);
    const sectionGroupIds = sectionGroups.map(g => g.id);

    // Vérifier que tous les IDs fournis appartiennent à cette section
    const invalidIds = groupIds.filter(id => !sectionGroupIds.includes(id));
    if (invalidIds.length > 0) {
      throw new Error('Some groups do not belong to this section');
    }

    // Réorganiser
    const reordered = await Group.reorderPositions(sectionId, groupIds);

    return reordered;
  }

  /**
   * Mettre à jour le layout (column_count) d'un group
   * @param {string} groupId - UUID du group
   * @param {string} userId - UUID du user
   * @param {number} columnCount - Nouveau nombre de colonnes (1-6)
   * @returns {Promise<object>} Group mis à jour
   * @throws {Error} Si validation échoue ou group non trouvé
   */
  async updateGroupLayout(groupId, userId, columnCount) {
    // Vérifier que le group existe et appartient au user
    const existing = await Group.findById(groupId, userId);
    if (!existing) {
      throw new Error('Group not found or access denied');
    }

    // Validation: column_count entre 1 et 6
    if (columnCount < 1 || columnCount > 6) {
      throw new Error('Column count must be between 1 and 6');
    }

    // Mettre à jour
    const updated = await Group.updateColumnCount(groupId, userId, columnCount);

    if (!updated) {
      throw new Error('Failed to update group layout');
    }

    return updated;
  }

  /**
   * Obtenir des statistiques sur les groups d'une section
   * @param {string} userId - UUID du user
   * @param {string} sectionId - UUID de la section
   * @returns {Promise<object>} Statistiques
   * @throws {Error} Si section non trouvée
   */
  async getSectionGroupsStats(userId, sectionId) {
    // Vérifier que la section existe et appartient au user
    const hasAccess = await Group.verifySectionOwnership(sectionId, userId);
    if (!hasAccess) {
      throw new Error('Section not found or access denied');
    }

    const groups = await Group.findAllBySection(sectionId);

    return {
      total: groups.length,
      manual_count: groups.filter(g => g.group_type === 'manual').length,
      dynamic_count: groups.filter(g => g.group_type === 'dynamic-top-used').length,
      groups: groups.map(g => ({
        id: g.id,
        name: g.name,
        position: g.position,
        column_count: g.column_count,
        group_type: g.group_type,
        bookmark_limit: g.bookmark_limit,
        created_at: g.created_at
        // TODO Itération 5: Ajouter bookmark count
      }))
    };
  }

  /**
   * Dupliquer un group avec tous ses bookmarks
   * @param {string} groupId - UUID du group à dupliquer
   * @param {string} userId - UUID du user
   * @returns {Promise<object>} Nouveau group créé
   * @throws {Error} Si group non trouvé ou pas d'accès
   */
  async duplicateGroup(groupId, userId) {
    const Bookmark = require('../bookmarks/bookmarks.model');

    // Récupérer le group original
    const original = await Group.findById(groupId, userId);
    if (!original) {
      throw new Error('Group not found or access denied');
    }

    // Générer un nouveau nom unique
    let newName = original.name;
    let suffix = 2;

    // Chercher si le nom existe déjà et trouver le prochain numéro disponible
    let nameExists = await Group.findByName(original.section_id, newName);
    while (nameExists) {
      newName = `${original.name} ${suffix}`;
      suffix++;
      nameExists = await Group.findByName(original.section_id, newName);
    }

    // Créer le nouveau group
    const newGroup = await Group.create(original.section_id, {
      name: newName,
      column_count: original.column_count,
      group_type: original.group_type,
      bookmark_limit: original.bookmark_limit,
      width: original.width || '100%'
    });

    // Dupliquer les bookmarks si c'est un group manuel
    if (original.group_type === 'manual') {
      const bookmarks = await Bookmark.findAllByGroup(groupId);

      for (const bookmark of bookmarks) {
        await Bookmark.create(newGroup.id, userId, {
          title: bookmark.title,
          url: bookmark.url,
          description: bookmark.description,
          favicon_url: bookmark.favicon_url,
          column: bookmark.column
        });
      }
    }

    return newGroup;
  }
}

module.exports = new GroupsService();
