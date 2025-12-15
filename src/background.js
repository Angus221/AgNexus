/**
 * AG Nexus - 后台服务 (Service Worker)
 */

// 点击扩展图标时打开侧边栏
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

// 设置侧边栏行为
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// 监听闹钟事件 (待办提醒)
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith('todo_')) {
    // 显示通知
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'AG Nexus 待办提醒',
      message: '您有一项待办事项即将到期',
      priority: 2
    });

    // 设置角标
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#D13438' });
  }
});

// 点击通知时打开侧边栏
chrome.notifications.onClicked.addListener(() => {
  // 清除角标
  chrome.action.setBadgeText({ text: '' });
});

// 安装或更新时
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // 首次安装，可以打开欢迎页面或初始化数据
    console.log('AG Nexus 已安装');
    // 默认启用悬浮球
    initFloatBall();
  } else if (details.reason === 'update') {
    console.log('AG Nexus 已更新到版本', chrome.runtime.getManifest().version);
    // 更新后也初始化悬浮球
    initFloatBall();
  }
});

// 扩展启动时初始化悬浮球
chrome.runtime.onStartup.addListener(() => {
  console.log('AG Nexus 启动');
  initFloatBall();
});

// 初始化悬浮球
async function initFloatBall() {
  // 获取设置
  const result = await chrome.storage.local.get(['settings']);
  const settings = result.settings || {};
  const floatBallEnabled = settings.floatBallEnabled !== false; // 默认为true

  console.log('初始化悬浮球，启用状态:', floatBallEnabled);

  if (floatBallEnabled) {
    // 获取所有标签页，主动注入内容脚本
    const tabs = await chrome.tabs.query({});

    for (const tab of tabs) {
      // 跳过特殊页面
      if (!tab.url ||
          tab.url.startsWith('chrome://') ||
          tab.url.startsWith('chrome-extension://') ||
          tab.url.startsWith('edge://') ||
          tab.url.startsWith('extension://') ||
          tab.url.startsWith('about:')) {
        continue;
      }

      try {
        // 先尝试发送消息（如果内容脚本已存在）
        await chrome.tabs.sendMessage(tab.id, {
          type: 'TOGGLE_FLOAT_BALL',
          enabled: true
        });
        console.log('成功发送消息到标签页:', tab.id);
      } catch (err) {
        // 内容脚本不存在，主动注入
        console.log('标签页无内容脚本，正在注入:', tab.id, tab.url);
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content/floatball.js']
          });
          console.log('成功注入内容脚本:', tab.id);
        } catch (injectErr) {
          console.log('注入脚本失败:', tab.id, injectErr.message);
        }
      }
    }
  }
}

// 更新所有标签页的悬浮球状态
async function updateFloatBallOnAllTabs(enabled) {
  console.log('更新所有标签页悬浮球状态:', enabled);
  const tabs = await chrome.tabs.query({});

  for (const tab of tabs) {
    // 跳过特殊页面
    if (!tab.url ||
        tab.url.startsWith('chrome://') ||
        tab.url.startsWith('chrome-extension://') ||
        tab.url.startsWith('edge://') ||
        tab.url.startsWith('extension://') ||
        tab.url.startsWith('about:')) {
      continue;
    }

    try {
      // 先尝试发送消息
      await chrome.tabs.sendMessage(tab.id, {
        type: 'TOGGLE_FLOAT_BALL',
        enabled: enabled
      });
      console.log('成功发送消息到标签页:', tab.id);
    } catch (err) {
      // 如果要启用悬浮球但内容脚本不存在，主动注入
      if (enabled) {
        console.log('标签页无内容脚本，正在注入:', tab.id);
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content/floatball.js']
          });
          console.log('成功注入内容脚本:', tab.id);
        } catch (injectErr) {
          console.log('注入脚本失败:', tab.id, injectErr.message);
        }
      }
    }
  }
}

// 监听来自sidepanel和content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background收到消息:', message);

  if (message.type === 'UPDATE_FLOAT_BALL') {
    // 更新所有标签页的悬浮球状态
    updateFloatBallOnAllTabs(message.enabled);
    sendResponse({ success: true });
  } else if (message.type === 'OPEN_SIDE_PANEL') {
    // 打开侧边栏（带错误处理）
    if (sender.tab) {
      const tabId = sender.tab.id;
      chrome.sidePanel.open({ tabId: tabId })
        .then(() => {
          console.log('侧边栏已打开，标签页:', tabId);
          sendResponse({ success: true });
        })
        .catch((error) => {
          console.error('打开侧边栏失败:', error);
          sendResponse({ success: false, error: error.message });
        });
    } else {
      console.error('没有发送者标签页信息');
      sendResponse({ success: false, error: 'No sender tab' });
    }
    return true; // 保持消息通道开启以异步响应
  } else if (message.type === 'TOGGLE_SIDE_PANEL') {
    // 保留 TOGGLE 支持，但简化为直接打开（因为 Chrome API 不支持可靠的关闭）
    if (sender.tab) {
      const tabId = sender.tab.id;
      chrome.sidePanel.open({ tabId: tabId })
        .then(() => {
          console.log('侧边栏已打开（通过 TOGGLE），标签页:', tabId);
          sendResponse({ success: true });
        })
        .catch((error) => {
          console.error('打开侧边栏失败（通过 TOGGLE）:', error);
          sendResponse({ success: false, error: error.message });
        });
    } else {
      sendResponse({ success: false, error: 'No sender tab' });
    }
    return true; // 保持消息通道开启以异步响应
  } else if (message.type === 'GET_CURRENT_TAB') {
    // 获取当前活动标签页信息
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0) {
        const currentTab = tabs[0];
        sendResponse({
          success: true,
          data: {
            url: currentTab.url,
            title: currentTab.title
          }
        });
      } else {
        sendResponse({ success: false });
      }
    });
    return true; // 保持消息通道开启以异步响应
  }

  return true; // 保持消息通道开启
});
