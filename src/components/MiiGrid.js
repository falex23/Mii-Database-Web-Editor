import React from 'react';
import { MiiGridCell } from './MiiGridCell';
import styles from './MiiGrid.module.css';

export function MiiGrid({ miiDataList, selectedMiiIndex, onSelectMii }) {
    if (!miiDataList) {
        return (
            <div className={styles.welcomeContainer}>
                <div className={styles.welcomeMessage}>
                    <h2>Welcome to Mii Database Editor</h2>
                    <p>Click "New" to start a fresh database or "Load" to open an existing `.dat` file.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.grid}>
            {miiDataList.map((miiData, index) => (
                <MiiGridCell
                    key={index}
                    index={index}
                    miiData={miiData}
                    isSelected={index === selectedMiiIndex}
                    onSelect={() => onSelectMii(index)}
                />
            ))}
        </div>
    );
}
