// src/TextSelectionMenu.jsx
import React, { useState, useEffect, useRef } from "react";
import { Lightbulb, BookOpen, Search } from "lucide-react";

const TextSelectionMenu = ({
  onAction,
  chatContainerRef,
  isQuizActive,
  isThinking,
}) => {
  const [selectedText, setSelectedText] = useState("");
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const selectionRef = useRef(null);

  useEffect(() => {
    const handleSelection = () => {
      // //console.log(isQuizActive);

      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (text && text.length >= 10) {
        const range = selection?.getRangeAt(0);
        if (!range) return;

        let container = range.commonAncestorContainer;
        if (container.nodeType !== Node.ELEMENT_NODE) {
          container = container.parentNode;
        }

        if (!container.closest(".llm-message-content")) {
          return;
        }

        const rect = range?.getBoundingClientRect();
        selectionRef.current = range;
        const chatRect = chatContainerRef.current?.getBoundingClientRect();

        if (rect && chatRect) {
          setSelectedText(text);
          setMenuPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
          });
          setShowMenu(true);
        }
      } else {
        setShowMenu(false);
        setSelectedText("");
        selectionRef.current = null;
      }
    };

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
        setSelectedText("");
        selectionRef.current = null;
        window.getSelection()?.removeAllRanges();
      }
    };

    const handleScroll = () => {
      if (selectionRef.current) {
        const rect = selectionRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setMenuPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
          });
        } else {
          setShowMenu(false);
        }
      }
    };

    const chatContainer = chatContainerRef.current;
    document.addEventListener("mouseup", handleSelection);
    document.addEventListener("touchend", handleSelection);
    document.addEventListener("mousedown", handleClickOutside);
    if (chatContainer) {
      chatContainer.addEventListener("scroll", handleScroll, true);
    }

    return () => {
      document.removeEventListener("mouseup", handleSelection);
      document.removeEventListener("touchend", handleSelection);
      document.removeEventListener("mousedown", handleClickOutside);
      if (chatContainer) {
        chatContainer.removeEventListener("scroll", handleScroll, true);
      }
    };
  }, [chatContainerRef]);

  const handleAction = (action) => {
    //console.log(selectedText);
    const selectedTextt = JSON.stringify(selectedText);
    //console.log(selectedTextt);

    onAction(action, selectedTextt);
    setShowMenu(false);
    setSelectedText("");
    selectionRef.current = null;
    window.getSelection()?.removeAllRanges();
  };

  if (!showMenu || isQuizActive || isThinking) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex gap-2"
      style={{
        left: `${menuPosition.x}px`,
        top: `${menuPosition.y}px`,
        transform: "translate(-50%, -100%)",
      }}
    >
      <button
        onClick={() => handleAction("analogy")}
        className="text-xs px-2 py-1 h-auto flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md"
      >
        <Lightbulb className="w-4 h-4 mr-1" />
        Analogy
      </button>
      <button
        onClick={() => handleAction("elaborate")}
        className="text-xs px-2 py-1 h-auto flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md"
      >
        <BookOpen className="w-4 h-4 mr-1" />
        Elaborate
      </button>
      <button
        onClick={() => handleAction("example")}
        className="text-xs px-2 py-1 h-auto flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md"
      >
        <Search className="w-4 h-4 mr-1" />
        Example
      </button>
    </div>
  );
};

export default TextSelectionMenu;
