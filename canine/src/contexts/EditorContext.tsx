import { EditorView } from "@codemirror/basic-setup";
import React, { createContext, useContext } from "react";
import { normalizePath } from "~/utils/normalizePath";

export interface EditorSourceData {
  filename: string | null;
  text?: string;
  view?: EditorView;
}

export type EditorType = "default" | "vim" | "emacs";
export type TabKeyType = "2" | "4" | "8" | "tab";
export type TabWidthType = "2" | "4" | "8";

export interface EditorSettingsData {
  opened: boolean;
  editor: EditorType;
  tabKey: TabKeyType;
  tabWidth: TabWidthType;
  smartIndent: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
  setEditor: React.Dispatch<React.SetStateAction<EditorType>>;
  setTabKey: React.Dispatch<React.SetStateAction<TabKeyType>>;
  setTabWidth: React.Dispatch<React.SetStateAction<TabWidthType>>;
  setSmartIndent: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface EditorContextState {
  title: string;
  description: string;
  currentTab: number;
  sources: EditorSourceData[];
  stdin: string;
  stdinOpened: boolean;
  settings: EditorSettingsData;

  setTitle: React.Dispatch<React.SetStateAction<string>>;
  setDescription: React.Dispatch<React.SetStateAction<string>>;
  setCurrentTab: React.Dispatch<React.SetStateAction<number>>;
  addSource: (filename: string) => number;
  removeSource: (tab: number) => void;
  setSources: (sources: EditorSourceData[]) => void;
  getSourceText: (tab: number) => string;
  setFilename: (tab: number, filename: string) => void;
  setView: (tab: number, view: EditorView) => void;
  setStdin: React.Dispatch<React.SetStateAction<string>>;
  setStdinOpened: React.Dispatch<React.SetStateAction<boolean>>;
}

function useSettings(): EditorSettingsData {
  const [opened, setOpened] = React.useState(false);
  const [editor, setEditor] = React.useState<EditorType>("default");
  const [tabKey, setTabKey] = React.useState<TabKeyType>("4");
  const [tabWidth, setTabWidth] = React.useState<TabWidthType>("4");
  const [smartIndent, setSmartIndent] = React.useState(true);
  return React.useMemo(
    (): EditorSettingsData => ({
      opened,
      editor,
      tabKey,
      tabWidth,
      smartIndent,
      setOpened,
      setEditor,
      setTabKey,
      setTabWidth,
      setSmartIndent,
    }),
    [
      opened,
      editor,
      tabKey,
      tabWidth,
      smartIndent,
      setOpened,
      setEditor,
      setTabKey,
      setTabWidth,
      setSmartIndent,
    ]
  );
}

function useEditorContextState(): EditorContextState {
  const [title, setTitle] = React.useState<string>("");
  const [description, setDescription] = React.useState<string>("");
  const [currentTab, setCurrentTab] = React.useState<number>(0);
  const [sources, setSources] = React.useState<EditorSourceData[]>([
    { filename: null },
  ]);
  const [stdin, setStdin] = React.useState<string>("");
  const [stdinOpened, setStdinOpened] = React.useState<boolean>(false);
  const [counter, setCounter] = React.useState<number>(0);
  const settings = useSettings();

  const addSource = React.useCallback(
    (filename: string): number => {
      // 既に存在している名前だったら、後ろに -1 や -2 を付けて重複させないようにする
      let resolvedFilename = filename;
      let n = 1;
      while (
        sources.findIndex(
          (source): boolean => resolvedFilename === source.filename
        ) >= 0
      ) {
        resolvedFilename = `${filename}-${n}`;
        n += 1;
      }
      const newSources = [...sources, { filename: resolvedFilename }];
      setSources(newSources);
      setCounter(counter + 1);
      return sources.length;
    },
    [sources, counter]
  );
  const removeSource = React.useCallback(
    (tab: number): void => {
      // デフォルトタブは消せないようにする
      if (tab === 0) {
        return;
      }

      const newSources = [...sources];
      newSources.splice(tab, 1);
      setSources(newSources);
      // 最後のタブだったらカレントを調整する
      if (currentTab === sources.length - 1) {
        setCurrentTab(currentTab - 1);
      }
    },
    [currentTab, sources]
  );

  const getSourceText = React.useCallback(
    (tab: number): string => {
      return (sources[tab].view as EditorView).state.doc.toString();
    },
    [sources]
  );

  const setFilename = React.useCallback(
    (tab: number, filename: string): void => {
      // デフォルトタブは名前変更できない
      if (tab === 0) {
        return;
      }
      // ファイル名の ../ とか ./ みたいなのを normalize する
      const newFilename = normalizePath(filename);
      // 既存のファイルが既にあったら変更させない
      if (
        sources.findIndex(
          (source): boolean => source.filename === newFilename
        ) !== -1
      ) {
        return;
      }

      const newSources = [...sources];
      newSources[tab] = { ...newSources[tab], filename: newFilename };
      setSources(newSources);
    },
    [sources]
  );
  const setView = React.useCallback(
    (tab: number, view: EditorView) => {
      const newSources = [...sources];
      newSources[tab] = { ...newSources[tab], view: view };
      setSources(newSources);
    },
    [sources]
  );

  return {
    title,
    description,
    currentTab,
    sources,
    stdin,
    stdinOpened,
    settings,
    setTitle,
    setDescription,
    setCurrentTab,
    addSource,
    removeSource,
    setSources,
    getSourceText,
    setFilename,
    setView,
    setStdin,
    setStdinOpened,
  };
}

const EditorContext = createContext<EditorContextState | null>(null);

function useEditorContext(): EditorContextState {
  return useContext(EditorContext) as EditorContextState;
}

export { EditorContext, useEditorContextState, useEditorContext };
