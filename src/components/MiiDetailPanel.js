import React, { useRef } from 'react';
import { MiiPreview } from './MiiPreview';
import { getMiiName, isMii, uint8ArrayToHexString } from '../utils/mii-utils';
import styles from './MiiDetailPanel.module.css';

const DetailButton = ({ onClick, children, disabled = false, title }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={styles.detailButton}
    >
        {children}
    </button>
);

const Placeholder = ({ message, subMessage }) => (
    <div className={styles.placeholder}>
        <p className={styles.placeholderMessage}>{message}</p>
        <p className={styles.placeholderSubMessage}>{subMessage}</p>
    </div>
);


export function MiiDetailPanel({ miiData, index, onClear, onDone, onSwap, onImport, onExport, isFileLoaded }) {
    const importMiiInputRef = useRef(null);

    if (!isFileLoaded) {
        return (
            <div className={styles.panel}>
                <Placeholder message="No Database Loaded" subMessage="Use 'New' or 'Load' to begin." />
            </div>
        );
    }

    if (index === -1) {
         return (
            <div className={styles.panel}>
                <Placeholder message="Select a Mii" subMessage="Click any Mii slot on the left to see its details." />
            </div>
        );
    }

    const hasMii = isMii(miiData);
    const miiName = getMiiName(miiData);
    const hexData = uint8ArrayToHexString(miiData);

    const handleIndexChange = (e) => {
        const newIndex = parseInt(e.target.value, 10);
        if (!isNaN(newIndex) && newIndex >= 0 && newIndex < 100) {
            onSwap(newIndex);
        }
    };

    const handleImportClick = () => {
        importMiiInputRef.current.click();
    };


    return (
        <div className={styles.panel}>
            <div>
                <h2 className={styles.title}>
                    <span className={styles.titleText}>{hasMii ? miiName : "Empty Slot"}</span>
                    <span className={styles.titleIndex}>#{index}</span>
                </h2>

                <div className={styles.section}>
                    <label className={styles.label}>Raw Mii Data (Hex)</label>
                    <textarea
                        readOnly
                        value={hasMii ? hexData : "This slot is empty."}
                        className={styles.textarea}
                    />
                </div>

                <div className={styles.buttonGrid}>
                    <DetailButton onClick={handleImportClick} title="Replace this Mii with one from a .mii file">Import Mii</DetailButton>
                    <DetailButton onClick={onExport} disabled={!hasMii} title="Save this Mii to a .mii file">Export Mii</DetailButton>
                    <DetailButton onClick={onClear} disabled={!hasMii} title="Clear this Mii slot">Clear Mii</DetailButton>
                    <DetailButton onClick={onDone} title="Deselect this Mii">Done</DetailButton>
                </div>
                
                <div className={styles.section}>
                    <label className={styles.label}>Change Index (Swap)</label>
                    <input
                        type="number"
                        min="0"
                        max="99"
                        value={index}
                        onChange={handleIndexChange}
                        className={styles.numberInput}
                    />
                </div>
            </div>

            <MiiPreview miiData={miiData} />

            <input
                type="file"
                ref={importMiiInputRef}
                onChange={onImport}
                className={styles.hiddenInput}
                accept=".mii"
            />
        </div>
    );
}
