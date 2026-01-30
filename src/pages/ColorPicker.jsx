import React from 'react';
import { ColorPicker, useColor } from 'react-colour-palette';
import 'react-colour-palette/dist/index.css';

export default function ColorPickerPage() {
  const [color, setColor] = useColor('hex', '#ff0000');

  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
      <div>
        <ColorPicker
          color={color}
          onChange={setColor}
          onChangeComplete={setColor}
          dark
        />
        <pre style={{ marginTop: 20 }}>
          {JSON.stringify(color, null, 2)}
        </pre>
      </div>
    </div>
  );
}
