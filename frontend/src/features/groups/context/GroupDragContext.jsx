import { createContext, useContext, useState } from 'react';

/**
 * GroupDragContext
 *
 * Contexte global pour gérer le drag & drop de groups entre sections
 * Permet de partager l'état du group dragué entre tous les GroupList
 */
const GroupDragContext = createContext(null);

export function GroupDragProvider({ children }) {
    const [draggedGroup, setDraggedGroup] = useState(null);
    const [sourceSectionId, setSourceSectionId] = useState(null);

    const startDrag = (group, sectionId) => {
        setDraggedGroup(group);
        setSourceSectionId(sectionId);
    };

    const endDrag = () => {
        setDraggedGroup(null);
        setSourceSectionId(null);
    };

    const value = {
        draggedGroup,
        sourceSectionId,
        startDrag,
        endDrag,
        isDragging: !!draggedGroup
    };

    return (
        <GroupDragContext.Provider value={value}>
            {children}
        </GroupDragContext.Provider>
    );
}

export function useGroupDrag() {
    const context = useContext(GroupDragContext);
    if (!context) {
        throw new Error('useGroupDrag must be used within GroupDragProvider');
    }
    return context;
}
