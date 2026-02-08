import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './ExplainThisUI.css';
import { CATEGORIES, PERSPECTIVES, SEVERITIES, STORAGE_KEY } from './constants';
import type {
  CategoryId,
  ExportModel,
  ImageNaturalSize,
  PerspectiveId,
  PinModel,
  SeverityId,
} from './types';
import {
  buildExportModel,
  clampNumber,
  createId,
  isValidExportModel,
  safeParseJson,
} from './helpers';
import { ColorPicker, useColor } from 'react-colour-palette';
import 'react-colour-palette/dist/index.css';

type PanModel = { x: number; y: number };

type PersistedModel = {
  imageUrl: string | null;
  imageNaturalSize: ImageNaturalSize;
  pins: any[];
  selectedPinId: string | null;
  activeCategory: CategoryId;
  activePerspective: PerspectiveId;
  zoom: number;
  pan: PanModel;
};

type PinColourPickerProps = {
  colour: string;
  onChange: (nextColour: string) => void;
};

function PinColourPicker({ colour, onChange }: PinColourPickerProps) {
  const [currentColour, setCurrentColour] = useColor('hex', colour);

  const handleChange = useCallback(
    (next: any) => {
      setCurrentColour(next);
      if (typeof next?.hex === 'string') {
        onChange(next.hex);
      }
    },
    [onChange, setCurrentColour]
  );

  return (
    <ColorPicker
      color={currentColour}
      onChange={handleChange}
      onChangeComplete={handleChange}
      dark
      width={260}
      height={120}
      hideRGB
    />
  );
}


function defaultPinColourForCategory(category: CategoryId) {
  if (category === 'ux') {
    return '#4ea8ff';
  }
  if (category === 'visual') {
    return '#b983ff';
  }
  if (category === 'logic') {
    return '#33d17a';
  }
  return '#ff6b6b';
}

function normalisePins(pins: any[]): PinModel[] {
  return pins
    .filter((pin) => pin && typeof pin === 'object' && typeof pin.id === 'string')
    .map((pin) => {
      const categoryValue = (typeof pin.category === 'string'
        ? pin.category
        : 'ux') as CategoryId;
      const perspectiveValue = (typeof pin.perspective === 'string'
        ? pin.perspective
        : 'user') as PerspectiveId;
      const severityValue = (typeof pin.severity === 'string'
        ? pin.severity
        : 'medium') as SeverityId;

      return {
        id: String(pin.id),
        x: typeof pin.x === 'number' ? pin.x : 0,
        y: typeof pin.y === 'number' ? pin.y : 0,
        title: typeof pin.title === 'string' ? pin.title : '',
        note: typeof pin.note === 'string' ? pin.note : '',
        category: categoryValue,
        perspective: perspectiveValue,
        severity: severityValue,
        colour:
          typeof pin.colour === 'string'
            ? pin.colour
            : defaultPinColourForCategory(categoryValue),
        createdAt:
          typeof pin.createdAt === 'string' ? pin.createdAt : new Date().toISOString(),
      };
    });
}

function ExplainThisUI() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageNaturalSize, setImageNaturalSize] = useState<ImageNaturalSize>({
    width: 0,
    height: 0,
  });

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<PanModel>({ x: 0, y: 0 });

  const [isPanning, setIsPanning] = useState(false);
  const [panPointerStart, setPanPointerStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState<PanModel>({ x: 0, y: 0 });
  const [spaceHeld, setSpaceHeld] = useState(false);

  const [activePerspective, setActivePerspective] = useState<PerspectiveId>('user');
  const [activeCategory, setActiveCategory] = useState<CategoryId>('ux');

  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [pins, setPins] = useState<PinModel[]>([]);

  const [isDragOver, setIsDragOver] = useState(false);

  const [draggingPinId, setDraggingPinId] = useState<string | null>(null);
  const [dragPinOffset, setDragPinOffset] = useState({ x: 0, y: 0 });

  const selectedPin = useMemo(() => {
    if (!selectedPinId) {
      return null;
    }
    return pins.find((pin) => pin.id === selectedPinId) ?? null;
  }, [pins, selectedPinId]);

  useEffect(() => {
    const savedText = localStorage.getItem(STORAGE_KEY);
    if (!savedText) {
      return;
    }

    const parsed = safeParseJson(savedText) as PersistedModel | null;
    if (!parsed || typeof parsed !== 'object') {
      return;
    }

    if (typeof parsed.imageUrl === 'string') {
      setImageUrl(parsed.imageUrl);
    }
    if (
      parsed.imageNaturalSize &&
      typeof parsed.imageNaturalSize.width === 'number' &&
      typeof parsed.imageNaturalSize.height === 'number'
    ) {
      setImageNaturalSize(parsed.imageNaturalSize);
    }
    if (Array.isArray(parsed.pins)) {
      setPins(normalisePins(parsed.pins));
    }
    if (typeof parsed.selectedPinId === 'string') {
      setSelectedPinId(parsed.selectedPinId);
    }
    if (typeof parsed.activeCategory === 'string') {
      setActiveCategory(parsed.activeCategory as CategoryId);
    }
    if (typeof parsed.activePerspective === 'string') {
      setActivePerspective(parsed.activePerspective as PerspectiveId);
    }
    if (typeof parsed.zoom === 'number') {
      setZoom(parsed.zoom);
    }
    if (
      parsed.pan &&
      typeof parsed.pan.x === 'number' &&
      typeof parsed.pan.y === 'number'
    ) {
      setPan(parsed.pan);
    }
  }, []);

  useEffect(() => {
    const persistModel: PersistedModel = {
      imageUrl,
      imageNaturalSize,
      pins,
      selectedPinId,
      activeCategory,
      activePerspective,
      zoom,
      pan,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistModel));
  }, [
    activeCategory,
    activePerspective,
    imageNaturalSize,
    imageUrl,
    pan,
    pins,
    selectedPinId,
    zoom,
  ]);

  const exportJson = useCallback(() => {
    const exportModel = buildExportModel(pins, imageNaturalSize);
    const blob = new Blob([JSON.stringify(exportModel, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'explain-this-ui.json';
    anchor.click();

    URL.revokeObjectURL(url);
  }, [imageNaturalSize, pins]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setSpaceHeld(true);
      }
      if (event.code === 'Delete' || event.code === 'Backspace') {
        if (selectedPinId) {
          setPins((previousPins) => previousPins.filter((pin) => pin.id !== selectedPinId));
          setSelectedPinId(null);
        }
      }
      if ((event.ctrlKey || event.metaKey) && event.code === 'KeyE') {
        event.preventDefault();
        exportJson();
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setSpaceHeld(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [exportJson, selectedPinId]);

  useEffect(() => {
    return () => {
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const resetSession = useCallback(() => {
    if (imageUrl && imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl);
    }
    setImageUrl(null);
    setImageNaturalSize({ width: 0, height: 0 });
    setPins([]);
    setSelectedPinId(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [imageUrl]);

  const onFileSelected = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        return;
      }

      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }

      const nextUrl = URL.createObjectURL(file);
      setImageUrl(nextUrl);
      setPins([]);
      setSelectedPinId(null);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    },
    [imageUrl]
  );

  const onFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const onImageLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    const element = event.currentTarget;
    setImageNaturalSize({ width: element.naturalWidth, height: element.naturalHeight });
  }, []);

  const viewPointToImagePoint = useCallback(
    (clientX: number, clientY: number) => {
      const containerElement = containerRef.current;
      if (!containerElement) {
        return null;
      }

      const rect = containerElement.getBoundingClientRect();
      const viewX = clientX - rect.left;
      const viewY = clientY - rect.top;

      const imageX = (viewX - pan.x) / zoom;
      const imageY = (viewY - pan.y) / zoom;

      if (imageNaturalSize.width <= 0 || imageNaturalSize.height <= 0) {
        return null;
      }

      const clampedX = clampNumber(imageX, 0, imageNaturalSize.width);
      const clampedY = clampNumber(imageY, 0, imageNaturalSize.height);

      return { x: clampedX, y: clampedY };
    },
    [imageNaturalSize.height, imageNaturalSize.width, pan.x, pan.y, zoom]
  );

  const onCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!imageUrl) {
        return;
      }
      if (isPanning || draggingPinId) {
        return;
      }
      if (event.button !== 0) {
        return;
      }

      const imagePoint = viewPointToImagePoint(event.clientX, event.clientY);
      if (!imagePoint) {
        return;
      }

      const pinId = createId();
      const nextPin: PinModel = {
        id: pinId,
        x: imagePoint.x,
        y: imagePoint.y,
        title: '',
        note: '',
        category: activeCategory,
        perspective: activePerspective,
        severity: 'medium',
        colour: defaultPinColourForCategory(activeCategory),
        createdAt: new Date().toISOString(),
      };

      setPins((previousPins) => [nextPin, ...previousPins]);
      setSelectedPinId(pinId);
    },
    [activeCategory, activePerspective, draggingPinId, imageUrl, isPanning, viewPointToImagePoint]
  );

  const updateSelectedPin = useCallback(
    (
      patch: Partial<
        Pick<PinModel, 'title' | 'note' | 'category' | 'perspective' | 'severity' | 'colour'>
      >
    ) => {
      if (!selectedPinId) {
        return;
      }

      setPins((previousPins) => {
        return previousPins.map((pin) => {
          if (pin.id !== selectedPinId) {
            return pin;
          }
          return { ...pin, ...patch };
        });
      });
    },
    [selectedPinId]
  );

  const deleteSelectedPin = useCallback(() => {
    if (!selectedPinId) {
      return;
    }
    setPins((previousPins) => previousPins.filter((pin) => pin.id !== selectedPinId));
    setSelectedPinId(null);
  }, [selectedPinId]);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const onWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      if (!imageUrl) {
        return;
      }
      event.preventDefault();

      const containerElement = containerRef.current;
      if (!containerElement) {
        return;
      }

      const rect = containerElement.getBoundingClientRect();
      const cursorX = event.clientX - rect.left;
      const cursorY = event.clientX - rect.left;

      const zoomFactor = event.deltaY < 0 ? 1.1 : 0.9;
      const nextZoom = clampNumber(zoom * zoomFactor, 0.25, 8);

      const imageX = (cursorX - pan.x) / zoom;
      const imageY = (cursorY - pan.y) / zoom;

      const nextPanX = cursorX - imageX * nextZoom;
      const nextPanY = cursorY - imageY * nextZoom;

      setZoom(nextZoom);
      setPan({ x: nextPanX, y: nextPanY });
    },
    [imageUrl, pan.x, pan.y, zoom]
  );

  const startPan = useCallback(
    (clientX: number, clientY: number) => {
      setIsPanning(true);
      setPanPointerStart({ x: clientX, y: clientY });
      setPanStart(pan);
    },
    [pan]
  );

  const onMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!imageUrl) {
        return;
      }

      const isMouseButtonPan = event.button === 1 || event.button === 2;
      const isSpacePan = event.button === 0 && spaceHeld;

      if (!isMouseButtonPan && !isSpacePan) {
        return;
      }

      event.preventDefault();
      startPan(event.clientX, event.clientY);
    },
    [imageUrl, spaceHeld, startPan]
  );

  const onMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (draggingPinId) {
        const imagePoint = viewPointToImagePoint(event.clientX, event.clientY);
        if (!imagePoint) {
          return;
        }

        const nextX = imagePoint.x - dragPinOffset.x;
        const nextY = imagePoint.y - dragPinOffset.y;

        setPins((previousPins) => {
          return previousPins.map((pin) => {
            if (pin.id !== draggingPinId) {
              return pin;
            }
            return {
              ...pin,
              x: clampNumber(nextX, 0, imageNaturalSize.width),
              y: clampNumber(nextY, 0, imageNaturalSize.height),
            };
          });
        });

        return;
      }

      if (!isPanning) {
        return;
      }

      const deltaX = event.clientX - panPointerStart.x;
      const deltaY = event.clientY - panPointerStart.y;
      setPan({ x: panStart.x + deltaX, y: panStart.y + deltaY });
    },
    [
      dragPinOffset.x,
      dragPinOffset.y,
      draggingPinId,
      imageNaturalSize.height,
      imageNaturalSize.width,
      isPanning,
      panPointerStart.x,
      panPointerStart.y,
      panStart.x,
      panStart.y,
      viewPointToImagePoint,
    ]
  );

  const onMouseUp = useCallback(() => {
    setIsPanning(false);
    setDraggingPinId(null);
  }, []);

  const importJson = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.onchange = (event: any) => {
      const file = event.target?.files?.[0] as File | undefined;
      if (!file) {
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const parsed = safeParseJson(String(reader.result));
        if (!isValidExportModel(parsed)) {
          return;
        }

        const exportModel = parsed as ExportModel;
        setPins(exportModel.pins);
        setSelectedPinId(exportModel.pins[0]?.id ?? null);
        setImageNaturalSize(exportModel.image.naturalSize);
      };
      reader.readAsText(file);
    };

    input.click();
  }, []);

  const onDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragOver(false);

      const file = event.dataTransfer.files?.[0];
      if (!file) {
        return;
      }
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const onPinMouseDown = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>, pinId: string) => {
      if (event.button !== 0) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();

      const imagePoint = viewPointToImagePoint(event.clientX, event.clientY);
      if (!imagePoint) {
        return;
      }

      const pin = pins.find((existingPin) => existingPin.id === pinId);
      if (!pin) {
        return;
      }

      setSelectedPinId(pinId);
      setDraggingPinId(pinId);
      setDragPinOffset({ x: imagePoint.x - pin.x, y: imagePoint.y - pin.y });
    },
    [pins, viewPointToImagePoint]
  );

  return (
    <div className="explain-ui">
      <header className="explain-ui-header">
        <div className="explain-ui-title">
          <h1>Explain This UI</h1>
          <p>Upload a screenshot, place pins, and write critiques from different perspectives.</p>
        </div>

        <div className="explain-ui-actions">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} hidden />

          <button className="btn" type="button" onClick={openFilePicker}>
            Upload Screenshot
          </button>

          <button className="btn" type="button" onClick={resetView} disabled={!imageUrl}>
            Reset View
          </button>

          <button className="btn" type="button" onClick={exportJson} disabled={pins.length === 0}>
            Export JSON
          </button>

          <button className="btn" type="button" onClick={importJson}>
            Import JSON
          </button>

          <button className="btn danger" type="button" onClick={resetSession}>
            Clear Session
          </button>
        </div>
      </header>

      <div className="explain-ui-main">
        <section>
          <div className="panel">
            <div className="panel-row">
              <div className="panel-group">
                <div className="panel-label">Perspective</div>
                <div className="segmented">
                  {PERSPECTIVES.map((item) => {
                    const isActive = item.id === activePerspective;
                    return (
                      <button
                        key={item.id}
                        className={`segmented-btn ${isActive ? 'active' : ''}`}
                        type="button"
                        onClick={() => setActivePerspective(item.id)}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="panel-group">
                <div className="panel-label">Category</div>
                <div className="segmented">
                  {CATEGORIES.map((item) => {
                    const isActive = item.id === activeCategory;
                    return (
                      <button
                        key={item.id}
                        className={`segmented-btn ${isActive ? 'active' : ''}`}
                        type="button"
                        onClick={() => setActiveCategory(item.id)}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="panel-hint">
              <div className="toolbar-row">
                <span className="badge">Click = add pin</span>
                <span className="badge">Wheel = zoom</span>
                <span className="badge">Middle/Right drag = pan</span>
                <span className="badge">Space + drag = pan</span>
                <span className="badge">Drag pin = move</span>
                <span className="badge">Del = delete selected</span>
              </div>
            </div>
          </div>

          <div
            className={`canvas ${isDragOver ? 'drag-over' : ''}`}
            ref={containerRef}
            onClick={onCanvasClick}
            onWheel={onWheel}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onContextMenu={(event) => event.preventDefault()}
            onDragEnter={onDragEnter}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            role="presentation"
          >
            {!imageUrl ? (
              <div className="canvas-empty">
                <div className="canvas-empty-inner">
                  <div className="canvas-empty-title">Drop a screenshot to start</div>
                  <div className="canvas-empty-subtitle">
                    Drag and drop an image here, or use “Upload Screenshot”.
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="canvas-stage"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: '0 0',
                }}
              >
                <img
                  ref={imageElementRef}
                  className="canvas-image"
                  src={imageUrl}
                  alt="Uploaded UI screenshot"
                  onLoad={onImageLoad}
                  draggable={false}
                />

                {pins.map((pin, pinIndex) => {
                  const isSelected = pin.id === selectedPinId;
                  const label = pins.length - pinIndex;

                  return (
                    <button
                      key={pin.id}
                      type="button"
                      className={`pin ${isSelected ? 'selected' : ''}`}
                      style={
                        {
                          left: pin.x,
                          top: pin.y,
                          ['--pin-colour' as any]: pin.colour,
                        } as React.CSSProperties
                      }
                      onMouseDown={(event) => onPinMouseDown(event, pin.id)}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedPinId(pin.id);
                      }}
                      title={`${pin.perspective} • ${pin.category} • ${pin.severity}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <aside className="explain-ui-right">
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">Pin Details</div>
              <button
                className="btn danger"
                type="button"
                onClick={deleteSelectedPin}
                disabled={!selectedPinId}
              >
                Delete
              </button>
            </div>

            {!selectedPin ? (
              <div className="panel-empty">Select a pin to edit, or click the image to create one.</div>
            ) : (
              <div className="form">
                <label className="field">
                  <div className="field-label">Title</div>
                  <input
                    className="input"
                    value={selectedPin.title}
                    onChange={(event) => updateSelectedPin({ title: event.target.value })}
                    placeholder="e.g. Primary CTA lacks emphasis"
                  />
                </label>

                <label className="field">
                  <div className="field-label">Notes</div>
                  <textarea
                    className="textarea"
                    rows={8}
                    value={selectedPin.note}
                    onChange={(event) => updateSelectedPin({ note: event.target.value })}
                    placeholder="Explain the issue, why it matters, and what you’d change."
                  />
                </label>

                <label className="field">
                  <div className="field-label">Colour</div>
                  <div className="pin-colour-picker">
                    <PinColourPicker
                      colour={selectedPin.colour}
                      onChange={(nextColour) => updateSelectedPin({ colour: nextColour })}
                    />
                  </div>
                </label>

                <label className="field">
                  <div className="field-label">Perspective</div>
                  <select
                    className="select"
                    value={selectedPin.perspective}
                    onChange={(event) =>
                      updateSelectedPin({ perspective: event.target.value as PerspectiveId })
                    }
                  >
                    {PERSPECTIVES.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <div className="field-label">Category</div>
                  <select
                    className="select"
                    value={selectedPin.category}
                    onChange={(event) =>
                      updateSelectedPin({ category: event.target.value as CategoryId })
                    }
                  >
                    {CATEGORIES.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <div className="field-label">Severity</div>
                  <select
                    className="select"
                    value={selectedPin.severity}
                    onChange={(event) =>
                      updateSelectedPin({ severity: event.target.value as SeverityId })
                    }
                  >
                    {SEVERITIES.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="meta">
                  <div>
                    <strong>Position:</strong> {Math.round(selectedPin.x)}, {Math.round(selectedPin.y)}
                  </div>
                  <div>
                    <strong>Zoom:</strong> {Math.round(zoom * 100)}%
                  </div>
                  <div>
                    <strong>Created:</strong> {new Date(selectedPin.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-title">Pins</div>
            {!pins.length ? (
              <div className="panel-empty">No pins yet.</div>
            ) : (
              <div className="pin-list">
                {pins.map((pin) => (
                  <button
                    key={pin.id}
                    type="button"
                    className={`pin-list-item ${pin.id === selectedPinId ? 'active' : ''}`}
                    onClick={() => setSelectedPinId(pin.id)}
                  >
                    <div className="pin-list-title">{pin.title || '(Untitled)'}</div>
                    <div className="pin-list-sub">
                      {pin.perspective} • {pin.category} • {pin.severity}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default ExplainThisUI;
