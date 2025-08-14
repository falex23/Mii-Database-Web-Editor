import React from 'react';
import { getMiiName, isMii } from '../utils/mii-utils';
import styles from './MiiGridCell.module.css';

export function MiiGridCell({ miiData, isSelected, onSelect, index }) {
    const hasMii = isMii(miiData);
    const miiName = getMiiName(miiData);

    const classNames = [styles.cell];
    if (isSelected) {
        classNames.push(styles.selected);
    }
    if (hasMii) {
        classNames.push(styles.valid);
    } else {
        classNames.push(styles.invalid);
    }
    
    return (
        <button onClick={onSelect} className={classNames.join(' ')}>
            <span className={styles.miiName}>{hasMii ? miiName : "Empty"}</span>
            <span className={styles.miiIndex}>#{index}</span>
        </button>
    );
}
