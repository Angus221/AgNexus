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
    // 向所有标签页发送显示悬浮球的消息
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'TOGGLE_FLOAT_BALL',
            enabled: true
          }).catch((err) => {
            console.log('初始化悬浮球失败:', tab.id, err.message);
          });
        }
      });
    });
  }
}

// 跟踪每个标签页的侧边栏状态
const sidePanelStates = new Map();

// 监听来自sidepanel和content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background收到消息:', message);

  if (message.type === 'UPDATE_FLOAT_BALL') {
    // 更新所有标签页的悬浮球状态
    chrome.tabs.query({}, (tabs) => {
      console.log('准备更新', tabs.length, '个标签页');
      tabs.forEach(tab => {
        // 跳过chrome://和扩展页面
        if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'TOGGLE_FLOAT_BALL',
            enabled: message.enabled
          }).then(() => {
            console.log('成功发送消息到标签页:', tab.id, tab.url);
          }).catch((err) => {
            console.log('发送消息失败:', tab.id, tab.url, err.message);
          });
        }
      });
    });
  } else if (message.type === 'OPEN_SIDE_PANEL') {
    // 打开侧边栏
    if (sender.tab) {
      chrome.sidePanel.open({ tabId: sender.tab.id });
      sidePanelStates.set(sender.tab.id, true);
    }
  } else if (message.type === 'TOGGLE_SIDE_PANEL') {
    // 切换侧边栏
    if (sender.tab) {
      const tabId = sender.tab.id;
      const isOpen = sidePanelStates.get(tabId);

      if (isOpen) {
        // 侧边栏已打开，关闭它
        // Chrome API 没有直接关闭方法，使用 setOptions 禁用然后重新启用
        chrome.sidePanel.setOptions({
          tabId: tabId,
          enabled: false
        }, () => {
          // 短暂延迟后重新启用，以便下次可以打开
          setTimeout(() => {
            chrome.sidePanel.setOptions({
              tabId: tabId,
              enabled: true
            });
          }, 100);
        });
        sidePanelStates.set(tabId, false);
      } else {
        // 侧边栏已关闭，打开它
        chrome.sidePanel.open({ tabId: tabId });
        sidePanelStates.set(tabId, true);
      }
    }
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

// 标签页关闭时清理状态
chrome.tabs.onRemoved.addListener((tabId) => {
  sidePanelStates.delete(tabId);
});
