import React, { useState, useEffect } from 'react';
import { encodeStudio, isMii } from '../utils/mii-utils';
import styles from './MiiPreview.module.css';

export function MiiPreview({ miiData }) {
    const [imageUrl, setImageUrl] = useState(null);

    useEffect(() => {
        if (isMii(miiData)) {
            const encodedString = encodeStudio(miiData);
            if (encodedString) {
                const fullUrl = `https://studio.mii.nintendo.com/miis/image.png?data=${encodedString}&type=face&width=512`;
                setImageUrl(fullUrl);
            }
        } else {
            setImageUrl(null);
        }
    }, [miiData]);

    if (!miiData || !isMii(miiData) || !imageUrl) {
        return null;
    }

    return (
        <div className={styles.previewContainer}>
            <img key={imageUrl} src={imageUrl} alt="Mii Preview" className={styles.previewImage} />
        </div>
    );
}
