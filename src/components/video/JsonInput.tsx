

import React, { useState } from "react";
import Label from "@/components/form/Label";

interface JsonInputProps {
    onDataReceived?: (data: any) => void;
}


const JsonInput: React.FC<JsonInputProps> = ({ onDataReceived }) => {
    const [jsonInput, setJsonInput] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleJsonSubmit = () => {
        if (!jsonInput.trim()) {
            setError('Please enter JSON data');
            return;
        }
        try {
            const parsed = JSON.parse(jsonInput);
            setError(null);
            if (onDataReceived) {
                onDataReceived(parsed);
            }
        } catch (e) {
            setError('Invalid JSON format');
        }
    };

    return (
        <div>
            <div style={{ marginBottom: '16px' }}>
                <Label>Paste JSON Data</Label>
                <textarea
                    placeholder="Paste JSON here..."
                    value={jsonInput}
                    onChange={e => setJsonInput(e.target.value)}
                    rows={8}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', fontFamily: 'monospace', fontSize: '14px' }}
                />
                <button
                    type="button"
                    onClick={handleJsonSubmit}
                    disabled={!jsonInput.trim()}
                    style={{
                        marginTop: '8px',
                        backgroundColor: !jsonInput.trim() ? '#9ca3af' : '#10b981',
                        color: 'white',
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: !jsonInput.trim() ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.2s'
                    }}
                >
                    Submit JSON
                </button>
                {error && (
                    <div style={{ color: 'red', fontSize: '14px', marginTop: '8px' }}>{error}</div>
                )}
            </div>
        </div>
    );
};

export default JsonInput;