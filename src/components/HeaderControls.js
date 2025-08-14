import React, { useRef } from 'react';
import styles from './HeaderControls.module.css';

const HeaderButton = ({ onClick, children, disabled = false, title }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={styles.headerButton}
    >
        {children}
    </button>
);

export function HeaderControls({ onNew, onLoad, onSave, onClean, isFileLoaded }) {
    const fileInputRef = useRef(null);

    const handleLoadClick = () => {
        fileInputRef.current.click();
    };

    return (
        <div className={styles.header}>
            <div className={styles.buttonGroup}>
                <HeaderButton onClick={onNew} title="Create a new, empty Mii database">New</HeaderButton>
                <HeaderButton onClick={handleLoadClick} title="Load a Mii database file (.dat)">Load</HeaderButton>
                <HeaderButton onClick={onSave} disabled={!isFileLoaded} title="Save the Mii database to a file">Save</HeaderButton>
                <HeaderButton onClick={onClean} disabled={!isFileLoaded} title="Reorganize Miis to the front of the database">Clean</HeaderButton>
            </div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={onLoad}
                className={styles.hiddenInput}
                accept=".dat"
            />
        </div>
    );
}
