// useDragAndDrop フックのテスト
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDragAndDrop } from '../useDragAndDrop';

describe('useDragAndDrop フック', () => {
  const createMockDragEvent = (options: Partial<DragEvent> = {}) => {
    const defaultDataTransfer = {
      files: Object.assign([], { item: () => null, length: 0 }) as unknown as FileList,
      items: Object.assign([], { add: vi.fn(), clear: vi.fn(), remove: vi.fn() }) as unknown as DataTransferItemList,
      types: [],
      dropEffect: 'none' as DataTransfer['dropEffect'],
      effectAllowed: 'all' as DataTransfer['effectAllowed'],
      clearData: vi.fn(),
      getData: vi.fn(),
      setData: vi.fn(),
      setDragImage: vi.fn(),
    };

    const event = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: { ...defaultDataTransfer, ...options.dataTransfer },
      currentTarget: document.createElement('div'),
      relatedTarget: null,
      ...options,
    } as unknown as React.DragEvent<HTMLDivElement>;
    
    return event;
  };

  it('初期状態ではisDraggingがfalse', () => {
    const onFilesDropped = vi.fn();
    const { result } = renderHook(() => useDragAndDrop(onFilesDropped));
    
    expect(result.current.isDragging).toBe(false);
  });

  it('ドラッグ開始時にisDraggingがtrueになる', () => {
    const onFilesDropped = vi.fn();
    const { result } = renderHook(() => useDragAndDrop(onFilesDropped));
    
    const mockEvent = createMockDragEvent({
      dataTransfer: { 
        items: Object.assign([{ kind: 'file' }], { add: vi.fn(), clear: vi.fn(), remove: vi.fn() }) as unknown as DataTransferItemList,
      },
    });

    act(() => {
      result.current.dragEventHandlers.onDragEnter(mockEvent);
    });

    expect(result.current.isDragging).toBe(true);
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
  });

  it('ファイルドロップ時にコールバックが呼ばれる', () => {
    const onFilesDropped = vi.fn();
    const { result } = renderHook(() => useDragAndDrop(onFilesDropped));
    
    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const mockEvent = createMockDragEvent({
      dataTransfer: {
        files: Object.assign([mockFile], { item: () => mockFile, length: 1 }) as unknown as FileList,
      },
    });

    act(() => {
      result.current.dragEventHandlers.onDrop(mockEvent);
    });

    expect(onFilesDropped).toHaveBeenCalledWith([mockFile]);
    expect(result.current.isDragging).toBe(false);
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
  });

  it('複数ファイルのドロップを処理する', () => {
    const onFilesDropped = vi.fn();
    const { result } = renderHook(() => useDragAndDrop(onFilesDropped));
    
    const mockFiles = [
      new File(['test1'], 'test1.pdf', { type: 'application/pdf' }),
      new File(['test2'], 'test2.pdf', { type: 'application/pdf' }),
    ];
    const mockEvent = createMockDragEvent({
      dataTransfer: {
        files: Object.assign(mockFiles, { item: (i: number) => mockFiles[i] || null, length: mockFiles.length }) as unknown as FileList,
      },
    });

    act(() => {
      result.current.dragEventHandlers.onDrop(mockEvent);
    });

    expect(onFilesDropped).toHaveBeenCalledWith(mockFiles);
  });

  it('ドラッグ領域から離れるとisDraggingがfalseになる', () => {
    const onFilesDropped = vi.fn();
    const { result } = renderHook(() => useDragAndDrop(onFilesDropped));
    
    // まずドラッグ開始
    const dragEnterEvent = createMockDragEvent({
      dataTransfer: { 
        items: Object.assign([{ kind: 'file' }], { add: vi.fn(), clear: vi.fn(), remove: vi.fn() }) as unknown as DataTransferItemList,
      },
    });
    act(() => {
      result.current.dragEventHandlers.onDragEnter(dragEnterEvent);
    });
    expect(result.current.isDragging).toBe(true);

    // ドラッグ離脱
    const dragLeaveEvent = createMockDragEvent();
    act(() => {
      result.current.dragEventHandlers.onDragLeave(dragLeaveEvent);
    });

    expect(result.current.isDragging).toBe(false);
  });

  it('子要素への移動ではdragleaveが発火しない', () => {
    const onFilesDropped = vi.fn();
    const { result } = renderHook(() => useDragAndDrop(onFilesDropped));
    
    // ドラッグ開始
    const dragEnterEvent = createMockDragEvent({
      dataTransfer: { 
        items: Object.assign([{ kind: 'file' }], { add: vi.fn(), clear: vi.fn(), remove: vi.fn() }) as unknown as DataTransferItemList,
      },
    });
    act(() => {
      result.current.dragEventHandlers.onDragEnter(dragEnterEvent);
    });
    expect(result.current.isDragging).toBe(true);

    // 子要素への移動をシミュレート
    const parentDiv = document.createElement('div');
    const childDiv = document.createElement('div');
    parentDiv.appendChild(childDiv);
    
    const dragLeaveEvent = createMockDragEvent({
      currentTarget: parentDiv as HTMLDivElement,
      relatedTarget: childDiv as HTMLDivElement,
    });
    
    // containsをモック
    parentDiv.contains = vi.fn().mockReturnValue(true);

    act(() => {
      result.current.dragEventHandlers.onDragLeave(dragLeaveEvent);
    });

    // isDraggingは変わらない
    expect(result.current.isDragging).toBe(true);
  });

  it('onDragOverでpreventDefaultが呼ばれる', () => {
    const onFilesDropped = vi.fn();
    const { result } = renderHook(() => useDragAndDrop(onFilesDropped));
    
    const mockEvent = createMockDragEvent();
    
    act(() => {
      result.current.dragEventHandlers.onDragOver(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
  });

  it('onDragOverでisDraggingがfalseの場合にtrueにセットされる', () => {
    const onFilesDropped = vi.fn();
    const { result } = renderHook(() => useDragAndDrop(onFilesDropped));
    
    expect(result.current.isDragging).toBe(false);
    
    const mockEvent = createMockDragEvent({
      dataTransfer: { 
        items: Object.assign([{ kind: 'file' }], { add: vi.fn(), clear: vi.fn(), remove: vi.fn() }) as unknown as DataTransferItemList,
      },
    });
    
    act(() => {
      result.current.dragEventHandlers.onDragOver(mockEvent);
    });

    expect(result.current.isDragging).toBe(true);
  });

  it('ファイルがない場合はコールバックが呼ばれない', () => {
    const onFilesDropped = vi.fn();
    const { result } = renderHook(() => useDragAndDrop(onFilesDropped));
    
    const mockEvent = createMockDragEvent({
      dataTransfer: {
        files: Object.assign([], { item: () => null, length: 0 }) as unknown as FileList,
      },
    });

    act(() => {
      result.current.dragEventHandlers.onDrop(mockEvent);
    });

    expect(onFilesDropped).not.toHaveBeenCalled();
  });
});