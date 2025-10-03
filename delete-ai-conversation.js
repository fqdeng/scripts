// ==UserScript==
// @name         🚀 Delete AI Conversation
// @namespace    https://github.com/xianghongai/Tampermonkey-UserScript
// @version      1.1.0
// @description    Delete AI conversation quickly and directly. Support shortcut key(Alt+Command+Backspace) and deleting all conversations.
// @description:zh-CN  快速/直接删除 AI 对话，支持快捷键(Alt+Command+Backspace)和一键删除所有对话。
// @description:zh-TW  快速/直接删除 AI 對話，支持快捷鍵(Alt+Command+Backspace)和一鍵刪除所有對話。
// @description:ja-JP  AI 会話を迅速に/直接に削除します。ショートカットキー(Alt+Command+Backspace)と全会話削除機能をサポートします。
// @description:ko-KR  AI 대화를 빠르고 직접적으로 삭제합니다. 단축키(Alt+Command+Backspace) 및 모든 대화 삭제를 지원합니다.
// @description:ru-RU  Быстро/непосредственно удалить AI-диалог. Поддерживает горячую клавишу(Alt+Command+Backspace) и удаление всех диалогов.
// @description:es-ES  Eliminar rápidamente/ directamente una conversación de IA. Soporta el atajo de teclado(Alt+Command+Backspace) y la eliminación de todas las conversaciones.
// @description:fr-FR  Supprimer rapidement/ directement une conversation AI. Prise en charge des raccourcis clavier(Alt+Command+Backspace) et de la suppression de toutes les conversations.
// @author       Nicholas Hsiang
// @icon         https://xinlu.ink/favicon.ico
// @match        https://monica.im/home*
// @match        https://grok.com/*
// @match        https://chatgpt.com/c/*
// @match        https://chat.deepseek.com/*
// @match        https://gemini.google.com/*
// @grant        GM.xmlHttpRequest
// @grant        GM_addStyle
// @run-at       document-end
// @license MIT
// ==/UserScript==

(function () {
  'use strict';
  console.log(GM_info.script.name);

  // 两种删除交互
  // 1. 通过右下角按钮，删除当前页面的对话
  // 2. 在对话列表中，点击删除按钮，删除对应的对话

  // 两种删除方式
  // 1. API：通过服务删除
  // 2. UI：借助原站点 UI 删除交互

  // 两种获取初始对话数据方式
  // 1. ID：从 URL 中获取
  // 2. TITLE：从对话标题中获取 (借助 Developer Tools + getElementPath(temp) 获取元素路径)

  // 模式
  const MODE = {
    ID_API: 'id_api',
    ID_UI: 'id_ui',
    TITLE_UI: 'title_ui',
  };

  const CONFIG = {
    'https://gemini.google.com': {
      mode: MODE.ID_UI,
      conversation_url_pattern: 'https://gemini.google.com/app/{id}',
      conversation_item_selector: '.conversation-items-container',
      conversation_item_action_selector: '.conversation-actions-menu-button',
      conversation_item_action_menu_item_selector: '[data-test-id="delete-button"]',
      delete_confirm_modal_button_selector: '[data-test-id="confirm-button"]',
      getConversationItemById(conversationId) {
        const conversationItems = Array.from(document.querySelectorAll('.conversation-items-container'));
        const conversationItem = conversationItems.find((item) => {
          const conversationIdElement = item.querySelector('.mat-mdc-tooltip-trigger.conversation');
          return conversationIdElement?.getAttribute('jslog').includes(conversationId);
        });
        return conversationItem;
      },
    },
    'https://grok.com': {
      mode: MODE.ID_API,
      api_url: 'https://grok.com/rest/app-chat/conversations/soft/{id}',
      method: 'DELETE',
      conversation_url_pattern: 'https://grok.com/chat/{id}',
      conversation_item_selector: '[data-sidebar="menu-button"][href^="/chat/"]',
      getConversationIdElement(conversationItem) {
        const conversationIdElement = conversationItem.querySelector('[href^="/chat/"]') || conversationItem;
        return conversationIdElement;
      },
      getConversationIdFormItem(element) {
        return element.getAttribute('href').split('/chat/')[1]
      },
    },
    'https://monica.im': {
      mode: MODE.ID_UI,
      conversation_url_pattern: '?convId={id}',
      conversation_item_selector: '[class^="conversation-name-item-wrapper"]',
      conversation_item_action_selector: '[class^="popover-content-wrapper"]',
      conversation_item_action_menu_item_selector: '[class^="dropdown-menu-item"]',
      delete_confirm_modal_button_selector: '[class^="monica-btn"]',
      getConversationItemById(conversationId) {
        const conversationItemSelector = '[href$="{id}"]'.replace('{id}', conversationId);
        return document.querySelector(conversationItemSelector);
      },
      getConversationIdFormQueryValue(queryValue) {
        return queryValue.split('conv:')[1];
      },
    },
    'https://chatgpt.com': {
      mode: MODE.ID_API,
      api_url: 'https://chatgpt.com/backend-api/conversation/{id}',
      method: 'PATCH',
      api_body: JSON.stringify({
        is_visible: false,
        conversation_id: '{id}',
      }),
      need_authorization: true,
      conversation_url_pattern: 'https://chatgpt.com/c/{id}',
      getConversationItems() {
        return Array.from(document.querySelectorAll('.group.__menu-item')).filter((item) => item.getAttribute('href')?.startsWith('/c/'));
      },
      getConversationItem(event) {
        const target = event.target;
        const conversationItem = parent(target, '.group.__menu-item');
        return conversationItem;
      },
      getConversationIdElement(conversationItem) {
        return conversationItem;
      },
      getConversationIdFormItem(element) {
        return element.getAttribute('href').split('/c/')[1];
      },
    },
    'https://chat.deepseek.com': {
      mode: MODE.TITLE_UI,
      conversation_url_pattern: 'https://chat.deepseek.com/a/chat/s/{id}',
      conversation_item_selector: 'html > body:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(3) > div:nth-child(1) > div > div[tabindex]',
      conversation_item_action_selector: 'div[tabindex]',
      conversation_item_action_menu_item_selector: '.ds-dropdown-menu-option.ds-dropdown-menu-option--error',
      delete_confirm_modal_button_selector: '.ds-modal-content .ds-button.ds-button--error',
      getConversationTitle() {
        return document.querySelector('html > body:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(3) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1)').textContent.trim();
      },
    },
  };

  let config = null;
  let isDeleting = false;
  let isDeletingAll = false; // 新增：跟踪“全部删除”的状态
  let deleteButton = null;
  let deleteAllButton = null; // 新增：保存“全部删除”按钮的引用

  function getConfig() {
    if (config) {
      return config;
    }
    config = CONFIG[window.location.origin];
    if (!config) {
      throw new Error(`未找到当前网站的配置: ${window.location.origin}`);
    }
    return config;
  }

  function getConversationIdFormUrl() {
    const currentUrl = window.location.href;
    const config = getConfig();
    const {
      conversation_url_pattern,
      getConversationIdFormQueryValue
    } = config;

    if (conversation_url_pattern.startsWith('?')) {
      const paramName = conversation_url_pattern.slice(1, conversation_url_pattern.indexOf('='));
      const urlParams = new URLSearchParams(window.location.search);
      const paramValue = urlParams.get(paramName);
      if (!paramValue) {
        console.error(`未找到查询参数: ${paramName}`);
        return null;
      }
      if (typeof getConversationIdFormQueryValue === 'function') {
        return getConversationIdFormQueryValue(paramValue);
      }
      return paramValue;
    } else {
      const pattern = conversation_url_pattern.replace('{id}', '(.+)');
      const regex = new RegExp(pattern);
      const match = currentUrl.match(regex);
      if (match && match[1]) {
        return match[1];
      }
      console.error('无法从URL中提取对话ID');
      return null;
    }
  }

  function deleteForIdUi(conversationItem, isBatch = false) {
    if (!isBatch) setButtonLoading(true);

    const {
      conversation_item_action_selector,
      conversation_item_action_menu_item_selector,
      delete_confirm_modal_button_selector
    } = getConfig();

    if (!conversationItem) {
      notification('未找到对话项', {
        type: 'error'
      });
      if (!isBatch) setButtonLoading(false);
      return;
    }

    const itemActionElement = conversationItem.querySelector(conversation_item_action_selector);

    if (itemActionElement) {
      itemActionElement.click();
      setTimeout(() => {
        const menuItemElements = document.querySelectorAll(conversation_item_action_menu_item_selector);
        let foundDeleteButton = false;
        for (let i = 0; i < menuItemElements.length; i++) {
          const menuItemElement = menuItemElements[i];
          const menuItemText = menuItemElement.textContent.trim();
          const isDeleteElement = menuItemText.includes('Delete') || menuItemText.includes('删除');

          if (isDeleteElement) {
            foundDeleteButton = true;
            menuItemElement.click();
            if (delete_confirm_modal_button_selector) {
              setTimeout(() => {
                const confirmModalButtonElements = document.querySelectorAll(delete_confirm_modal_button_selector);
                let foundConfirmButton = false;
                for (let i = 0; i < confirmModalButtonElements.length; i++) {
                  const confirmModalButtonElement = confirmModalButtonElements[i];
                  const confirmModalButtonText = confirmModalButtonElement.textContent.trim();
                  const isDeleteElement = confirmModalButtonText.includes('Delete') || confirmModalButtonText.includes('删除');
                  if (isDeleteElement) {
                    foundConfirmButton = true;
                    confirmModalButtonElement.click();
                    if (!isBatch) notification('已发起删除请求');
                    if (!isBatch) setButtonLoading(false);
                    break;
                  }
                }
                if (!foundConfirmButton) {
                  notification('未找到确认按钮', {
                    type: 'error'
                  });
                  if (!isBatch) setButtonLoading(false);
                }
              }, 500);
            } else {
              if (!isBatch) notification('已发起删除请求');
              if (!isBatch) setButtonLoading(false);
            }
            break;
          }
        }
        if (!foundDeleteButton) {
          notification('未找到删除按钮', {
            type: 'error'
          });
          if (!isBatch) setButtonLoading(false);
        }
      }, 500);
    } else {
      notification('未找到操作按钮', {
        type: 'error'
      });
      if (!isBatch) setButtonLoading(false);
    }
  }

  async function deleteForIdApi(conversationId, isBatch = false) {
    if (!isBatch) setButtonLoading(true);

    if (!conversationId) {
      notification('无法获取对话ID', {
        type: 'error'
      });
      if (!isBatch) setButtonLoading(false);
      return;
    }

    const {
      api_url,
      method,
      api_body,
      need_authorization
    } = getConfig();
    const url = api_url.replace('{id}', conversationId);
    const headers = {
      'Content-Type': 'application/json',
    };

    let cacheAuthorization = null;
    const cacheAuthorizationKey = `authorization__${window.location.origin}`;
    if (need_authorization) {
      cacheAuthorization = localStorage.getItem(cacheAuthorizationKey);
      if (cacheAuthorization) {
        headers.Authorization = cacheAuthorization;
      } else {
        const authorization = prompt('请输入 Authorization 值 (将通过 localStorage 缓存，下次删除时无需再次输入)');
        if (authorization) {
          headers.Authorization = authorization;
        } else {
          notification('请输入 Authorization 值', {
            type: 'error'
          });
          if (!isBatch) setButtonLoading(false);
          return;
        }
      }
    }

    try {
      let response;
      if (method === 'DELETE') {
        response = await fetch(url, {
          method
        });
      } else if (method === 'PATCH') {
        response = await fetch(url, {
          method,
          body: api_body.replace('{id}', conversationId),
          headers,
        });
      }

      if (response && response.ok) {
        if (!isBatch) notification('已发起删除请求，通过 API 删除，需要刷新页面查看结果');
        if (need_authorization) {
          localStorage.setItem(cacheAuthorizationKey, headers.Authorization);
        }
      } else {
        console.error(response);
        notification('删除出现异常，请查看 Developer Tools 中的 Console 输出、检查 Network 请求', {
          type: 'error'
        });
      }
    } catch (error) {
      console.error(error);
      notification('删除请求失败: ' + error.message, {
        type: 'error'
      });
    } finally {
      if (!isBatch) {
        setTimeout(() => {
          setButtonLoading(false);
        }, 1000);
      }
    }
  }

  function deleteForTitleUi(conversationTitle, isBatch = false) {
    if (!isBatch) setButtonLoading(true);
    const config = getConfig();
    const {
      conversation_item_selector,
      conversation_item_action_selector,
      conversation_item_action_menu_item_selector,
      delete_confirm_modal_button_selector
    } = config;

    const conversationItemElements = document.querySelectorAll(conversation_item_selector);
    let itemFound = false;

    for (let i = 0; i < conversationItemElements.length; i++) {
      const conversationItemElement = conversationItemElements[i];
      const conversationItemText = conversationItemElement.textContent.trim();
      if (conversationItemText === conversationTitle) {
        itemFound = true;
        const conversationItemActionElement = conversationItemElement.querySelector(conversation_item_action_selector) || conversationItemElement;
        conversationItemActionElement.click();

        setTimeout(() => {
          const conversationItemActionMenuElements = document.querySelectorAll(conversation_item_action_menu_item_selector);
          for (let j = 0; j < conversationItemActionMenuElements.length; j++) {
            const conversationItemActionMenuElement = conversationItemActionMenuElements[j];
            const conversationItemActionMenuElementText = conversationItemActionMenuElement.textContent.trim();
            if (conversationItemActionMenuElementText.includes('Delete') || conversationItemActionMenuElementText.includes('删除')) {
              conversationItemActionMenuElement.click();
              setTimeout(() => {
                const deleteConfirmModalButtonElements = document.querySelectorAll(delete_confirm_modal_button_selector);
                for (let k = 0; k < deleteConfirmModalButtonElements.length; k++) {
                  const deleteConfirmModalButtonElement = deleteConfirmModalButtonElements[k];
                  const deleteConfirmModalButtonElementText = deleteConfirmModalButtonElement.textContent.trim();
                  if (deleteConfirmModalButtonElementText.includes('Delete') || deleteConfirmModalButtonElementText.includes('删除')) {
                    deleteConfirmModalButtonElement.click();
                    if (!isBatch) notification('已删除对话');
                    if (!isBatch) setButtonLoading(false);
                    break;
                  }
                }
              }, 500);
              break;
            }
          }
        }, 500);
        break;
      }
    }
    if (!itemFound && !isBatch) {
        setButtonLoading(false);
        notification('未找到匹配标题的对话项', {type: 'error'});
    }
  }

  function handleDelete() {
    if (isDeleting || isDeletingAll) {
      notification('正在处理删除请求，请稍候...', {
        type: 'warning'
      });
      return;
    }

    const config = getConfig();
    if (!config) {
      notification('无法获取配置信息', {
        type: 'error'
      });
      return;
    }

    const {
      mode,
      getConversationTitle,
      getConversationItemById
    } = config;
    const conversationId = getConversationIdFormUrl();

    if (mode === MODE.ID_API) {
      deleteForIdApi(conversationId);
    } else if (mode === MODE.ID_UI) {
      deleteForIdUi(getConversationItemById(conversationId));
    } else if (mode === MODE.TITLE_UI) {
      deleteForTitleUi(getConversationTitle());
    }
  }

  // 新增：处理全部删除的函数
  async function handleDeleteAll() {
    if (isDeleting || isDeletingAll) {
        notification('已有删除任务正在进行中，请稍候。', { type: 'warning' });
        return;
    }

    const config = getConfig();
    const { getConversationItems, conversation_item_selector, mode } = config;

    let conversationItems = [];
    if (typeof getConversationItems === 'function') {
        conversationItems = getConversationItems();
    } else {
        conversationItems = Array.from(document.querySelectorAll(conversation_item_selector));
    }

    if (conversationItems.length === 0) {
        notification('没有找到可以删除的对话。', { type: 'info' });
        return;
    }

    if (!confirm(`您确定要删除全部 ${conversationItems.length} 个对话吗？此操作无法撤销。`)) {
        return;
    }

    isDeletingAll = true;
    setDeleteAllButtonState(true, conversationItems.length, 0);

    const total = conversationItems.length;
    for (let i = 0; i < total; i++) {
        const item = conversationItems[i];
        setDeleteAllButtonState(true, total, i + 1);
        notification(`正在删除第 ${i + 1} / ${total} 个对话...`, { type: 'info' });

        try {
            if (mode === MODE.ID_API) {
                const idElement = config.getConversationIdElement(item);
                const id = config.getConversationIdFormItem(idElement);
                await deleteForIdApi(id, true);
            } else if (mode === MODE.ID_UI) {
                deleteForIdUi(item, true);
            } else if (mode === MODE.TITLE_UI) {
                const title = item.textContent.trim();
                deleteForTitleUi(title, true);
            }
            // 为UI操作和API请求设置延迟，确保上一个操作完成
            await new Promise(resolve => setTimeout(resolve, 2500));
        } catch (error) {
            console.error(`删除第 ${i + 1} 个对话时出错:`, error);
            notification(`删除第 ${i + 1} 个对话失败，详情请查看控制台。`, { type: 'error' });
            // 即使出错也继续尝试删除下一个
        }
    }

    notification('所有对话已删除完毕，请刷新页面查看结果。', { type: 'success', duration: 8000 });
    isDeletingAll = false;
    setDeleteAllButtonState(false);
  }


  function createElement() {
    const wrap = document.createElement('div');
    wrap.className = 'x-conversation-action-wrap';

    // 删除按钮
    const btn = document.createElement('button');
    btn.textContent = 'Delete';
    btn.className = 'x-conversation-action x-conversation-delete';
    btn.onclick = handleDelete;
    deleteButton = btn;
    wrap.appendChild(btn);

    // 新增：全部删除按钮
    const deleteAllBtn = document.createElement('button');
    deleteAllBtn.textContent = 'Delete All';
    deleteAllBtn.className = 'x-conversation-action x-conversation-delete-all';
    deleteAllBtn.onclick = handleDeleteAll;
    deleteAllButton = deleteAllBtn; // 保存引用
    wrap.appendChild(deleteAllBtn);

    // 侦测对话项按钮
    const inspectConversationItemBtn = document.createElement('button');
    inspectConversationItemBtn.textContent = 'Inspect';
    inspectConversationItemBtn.className = 'x-conversation-action x-conversation-inspect';
    inspectConversationItemBtn.onclick = createRemoveActionForConversationItem;
    wrap.appendChild(inspectConversationItemBtn);

    document.body.appendChild(wrap);
  }

  function createRemoveActionForConversationItem() {
    const config = getConfig();
    const {
      getConversationItems,
      conversation_item_selector
    } = config;

    let conversationItemElements = []
    if (typeof getConversationItems === 'function') {
      conversationItemElements = getConversationItems();
    } else {
      conversationItemElements = document.querySelectorAll(conversation_item_selector);
    }

    for (let i = 0; i < conversationItemElements.length; i++) {
      const conversationItemElement = conversationItemElements[i];
      conversationItemElement.style.position = 'relative';

      const removeIconElement = conversationItemElement.querySelector('.x-conversation-item-remove');
      if (removeIconElement) {
        if (removeIconElement.classList.contains('hidden')) {
          removeIconElement.classList.remove('hidden');
        } else {
          removeIconElement.classList.add('hidden');
        }
        continue;
      }

      const iconElement = document.createElement('i');
      iconElement.innerHTML = getRemoveIcon();
      iconElement.className = 'x-conversation-item-remove';
      iconElement.setAttribute('title', 'Delete Conversation');
      conversationItemElement.appendChild(iconElement);
    }
  }

  function setupKeyboardShortcut() {
    document.addEventListener('keydown', function (event) {
      if (event.altKey && event.metaKey && event.key === 'Backspace') {
        event.preventDefault();
        handleDelete();
        notification('通过快捷键触发删除操作');
      }
    });
  }

  function addEventListenerForConversationItem() {
    document.addEventListener('click', function (event) {
      const target = event.target;
      const {
        mode,
        conversation_item_selector,
        getConversationItem,
        getConversationIdElement,
        getConversationIdFormItem
      } = getConfig();

      if (matches(target, '.x-conversation-item-remove')) {
        if (mode === MODE.ID_UI) {
          event.stopPropagation();
          event.preventDefault();
          const conversationItem = parent(target, conversation_item_selector);
          deleteForIdUi(conversationItem);
          return;
        } else if (mode === MODE.ID_API) {
          event.stopPropagation();
          event.preventDefault();
          let conversationItem = null;
          if (typeof getConversationItem === 'function') {
            conversationItem = getConversationItem(event);
          } else if (typeof conversation_item_selector === 'string') {
            conversationItem = parent(target, conversation_item_selector);
          }
          const conversationIdElement = getConversationIdElement(conversationItem);
          const conversationId = getConversationIdFormItem(conversationIdElement);
          deleteForIdApi(conversationId);
          return;
        }

        setTimeout(() => {
          handleDelete();
        }, 1000);
      }
    });
  }

  function main() {
    createStyle();
    createElement();
    setupKeyboardShortcut();
    addEventListenerForConversationItem();
  }

  main();

  function notification(message, {
    type = 'success',
    duration = 5000
  } = {}) {
    const existing = document.querySelector('.x-conversation-delete-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = `x-conversation-delete-notification ${type}`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), duration);
  }

  function setButtonLoading(loading) {
    if (!deleteButton) return;
    isDeleting = loading;
    if (loading) {
      deleteButton.classList.add('loading');
      deleteButton.textContent = '正在删除...';
      deleteButton.disabled = true;
      if (deleteAllButton) deleteAllButton.disabled = true;
    } else {
      deleteButton.classList.remove('loading');
      deleteButton.textContent = 'Delete';
      deleteButton.disabled = false;
      if (deleteAllButton && !isDeletingAll) deleteAllButton.disabled = false;
    }
  }

  // 新增：设置“全部删除”按钮状态的函数
  function setDeleteAllButtonState(loading, total = 0, current = 0) {
    if (!deleteAllButton) return;

    if (loading) {
        isDeletingAll = true;
        deleteAllButton.disabled = true;
        deleteAllButton.textContent = `删除中...(${current}/${total})`;
        if (deleteButton) deleteButton.disabled = true;
    } else {
        isDeletingAll = false;
        deleteAllButton.disabled = false;
        deleteAllButton.textContent = 'Delete All';
        if (deleteButton && !isDeleting) deleteButton.disabled = false;
    }
  }

  function createStyle() {
    GM_addStyle(`
      .x-conversation-action-wrap {
        position: fixed;
        bottom: 18px;
        right: 18px;
        z-index: 99999;
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .x-conversation-action {
        padding: 4px 8px;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      .x-conversation-inspect {
        background:rgb(255, 163, 24);
      }
      .x-conversation-inspect:hover {
        background: #ff9800;
      }
      .x-conversation-delete {
        background: #ff4444;
        color: white;
      }
      /* 新增：全部删除按钮样式 */
      .x-conversation-delete-all {
        background: #d32f2f; /* 更深的红色 */
        color: white;
      }
      .x-conversation-delete-all:hover {
        background: #b71c1c;
      }
      .x-conversation-delete:disabled, .x-conversation-delete-all:disabled {
        cursor: not-allowed;
        opacity: 0.7;
        background: #999;
      }
      .x-conversation-delete.loading {
        background: #999;
        position: relative;
        padding-right: 24px;
      }
      .x-conversation-delete.loading::after {
        content: "";
        position: absolute;
        width: 10px;
        height: 10px;
        top: 50%;
        right: 8px;
        margin-top: -5px;
        border: 2px solid rgba(255, 255, 255, 0.5);
        border-top-color: white;
        border-radius: 50%;
        animation: loader-spin 1s linear infinite;
      }
      .x-conversation-delete-notification {
        position: fixed;
        bottom: 62px;
        right: 18px;
        padding: 4px 8px;
        border-radius: 4px;
        color: white;
        font-family: system-ui;
        font-size: 12px;
        animation: slideIn 0.3s;
        z-index: 99999;
      }
      .x-conversation-item-remove {
        position: absolute;
        left: 100%;
        transform: translateX(-60px) translateY(-50%);
        top: 50%;
        display: block;
        width: 18px;
        height: 18px;
        line-height: 18px;
        cursor: pointer;
      }
      .x-conversation-item-remove.hidden {
        display: none;
      }
      .x-conversation-delete-notification.success { background: #4CAF50; }
      .x-conversation-delete-notification.error { background: #ff4444; }
      .x-conversation-delete-notification.warning { background: #ff9800; }
      .x-conversation-delete-notification.info { background: #2196F3; } /* 新增 */

      @keyframes slideIn {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }
      @keyframes loader-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
  `);
  }

  function getRemoveIcon() {
    return `<?xml version="1.0" encoding="UTF-8"?><svg width="16" height="16" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18.4237 10.5379C18.794 10.1922 19.2817 10 19.7883 10H42C43.1046 10 44 10.8954 44 12V36C44 37.1046 43.1046 38 42 38H19.7883C19.2817 38 18.794 37.8078 18.4237 37.4621L4 24L18.4237 10.5379Z" fill="#d0021b" stroke="#d0021b" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M36 19L26 29" stroke="#FFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 19L36 29" stroke="#FFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  function getElementPath(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }
    const path = [];
    while (element && element.nodeType === Node.ELEMENT_NODE) {
      let selector = element.tagName.toLowerCase();
      const parent = element.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children);
        const index = siblings.indexOf(element) + 1;
        selector += `:nth-child(${index})`;
      }
      path.unshift(selector);
      element = parent;
    }
    return path.join(' > ');
  }

  function matches(currentElement, selector) {
    while (currentElement !== null && currentElement !== document.body) {
      if (currentElement.matches(selector)) {
        return true;
      }
      currentElement = currentElement.parentElement;
    }
    return document.body.matches(selector);
  }

  function parent(currentElement, selector) {
    for (; currentElement && currentElement !== document; currentElement = currentElement.parentNode) {
      if (currentElement.matches(selector)) return currentElement;
    }
    return null;
  }
})();
