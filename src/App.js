import React, { useState } from 'react';
import './App.css';
import { HeaderControls } from './components/HeaderControls';
import { MiiGrid } from './components/MiiGrid';
import { MiiDetailPanel } from './components/MiiDetailPanel';
import {
    parseDatabase,
    generateEmptyMiiList,
    buildFile,
    isMii
} from './utils/mii-utils';

function App() {
    const [miiDataList, setMiiDataList] = useState(null);
    const [selectedMiiIndex, setSelectedMiiIndex] = useState(-1);

    const handleLoad = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const parsedList = parseDatabase(event.target.result);
            if (parsedList) {
                setMiiDataList(parsedList);
                setSelectedMiiIndex(-1);
            }
        };
        reader.onerror = () => alert("Error reading file.");
        reader.readAsArrayBuffer(file);
        e.target.value = null;
    };
    
    const triggerDownload = (fileName, data) => {
        const blob = new Blob([data], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    const handleSave = () => {
        if (!miiDataList) return;
        const fileBytes = buildFile(miiDataList);
        triggerDownload('RFL_DB.dat', fileBytes);
    };
    
    const handleNew = () => {
        setMiiDataList(generateEmptyMiiList());
        setSelectedMiiIndex(-1);
    };

    const handleClean = () => {
        if (!miiDataList) return;
        const sortedMiis = miiDataList.filter(isMii);
        const emptyMiis = Array.from({ length: 100 - sortedMiis.length }, () => new Uint8Array(74));
        
        let newSelectedMiiIndex = -1;
        if (selectedMiiIndex !== -1 && isMii(miiDataList[selectedMiiIndex])) {
            const selectedMiiData = miiDataList[selectedMiiIndex];
            newSelectedMiiIndex = sortedMiis.findIndex(mii => mii === selectedMiiData);
        }
        
        setMiiDataList([...sortedMiis, ...emptyMiis]);
        setSelectedMiiIndex(newSelectedMiiIndex);
    };

    const handleClearMii = () => {
        if (selectedMiiIndex === -1) return;
        const newList = [...miiDataList];
        newList[selectedMiiIndex] = new Uint8Array(74);
        setMiiDataList(newList);
    };

    const handleSwapMii = (newIndex) => {
        if (selectedMiiIndex === -1 || newIndex === selectedMiiIndex) return;
        const newList = [...miiDataList];
        [newList[selectedMiiIndex], newList[newIndex]] = [newList[newIndex], newList[selectedMiiIndex]];
        setMiiDataList(newList);
        setSelectedMiiIndex(newIndex);
    };

    const handleImportMii = (e) => {
        const file = e.target.files[0];
        if (!file || selectedMiiIndex === -1) return;
        
        if (file.size !== 74) {
            alert(`Invalid .mii file. Expected 74 bytes, got ${file.size}.`);
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const newMiiData = new Uint8Array(event.target.result);
            const newList = [...miiDataList];
            newList[selectedMiiIndex] = newMiiData;
            setMiiDataList(newList);
        };
        reader.readAsArrayBuffer(file);
        e.target.value = null;
    };

    const handleExportMii = () => {
        if (selectedMiiIndex === -1 || !isMii(miiDataList[selectedMiiIndex])) return;
        triggerDownload(`Mii_${selectedMiiIndex}.mii`, miiDataList[selectedMiiIndex]);
    };
    

    return (
        <div className="app">
            <HeaderControls
                onNew={handleNew}
                onLoad={handleLoad}
                onSave={handleSave}
                onClean={handleClean}
                isFileLoaded={!!miiDataList}
            />
            <main className="main-content">
                <MiiGrid
                    miiDataList={miiDataList}
                    selectedMiiIndex={selectedMiiIndex}
                    onSelectMii={setSelectedMiiIndex}
                />
                <MiiDetailPanel
                    miiData={miiDataList ? miiDataList[selectedMiiIndex] : null}
                    index={selectedMiiIndex}
                    onClear={handleClearMii}
                    onDone={() => setSelectedMiiIndex(-1)}
                    onSwap={handleSwapMii}
                    onImport={handleImportMii}
                    onExport={handleExportMii}
                    isFileLoaded={!!miiDataList}
                />
            </main>
        </div>
    );
}

export default App;
