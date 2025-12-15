/**
 * AG Nexus - LangChain 工具定义
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

// 辅助函数：获取当前标签页信息
async function getCurrentTabInfo() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_CURRENT_TAB' }, (response) => {
      if (response && response.success) {
        resolve(response.data);
      } else {
        resolve(null);
      }
    });
  });
}

// 辅助函数：从 URL 提取域名
function extractDomainName(url) {
  try {
    const urlObj = new URL(url);
    let domain = urlObj.hostname.replace(/^www\./, '');
    const parts = domain.split('.');
    if (parts.length >= 2) {
      domain = parts.slice(-2).join('.');
    }
    return domain;
  } catch (e) {
    return url;
  }
}

// 辅助函数：从 URL 提取最后一级路径
function extractLastPath(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.replace(/\/$/, '');
    const parts = pathname.split('/');
    const lastPart = parts.filter(p => p).pop();
    return lastPart ? decodeURIComponent(lastPart) : extractDomainName(url);
  } catch (e) {
    return url;
  }
}

// 工具 1: 添加导航
export const addNavTool = new DynamicStructuredTool({
  name: "add_nav",
  description: "添加快捷导航到导航栏，用于常用网站的快捷入口。title 可以为空字符串，系统会自动提取一级域名。",
  schema: z.object({
    title: z.string().describe("导航名称，可以为空字符串，系统会自动提取一级域名"),
    url: z.string().describe("网址，支持 {{current_tab}} 标识当前网页"),
  }),
  func: async ({ title, url }) => {
    try {
      // 处理 {{current_tab}}
      if (url === '{{current_tab}}' || title === '{{current_tab}}') {
        const tabInfo = await getCurrentTabInfo();
        if (tabInfo) {
          if (url === '{{current_tab}}') url = tabInfo.url;
          if (title === '{{current_tab}}') title = tabInfo.title;
        }
      }

      // 自动提取域名
      if (!title || title === '') {
        title = extractDomainName(url);
      }

      await window.Navigation.addByAI({ title, url });
      return `✅ 已添加导航：${title}`;
    } catch (error) {
      return `❌ 添加导航失败：${error.message}`;
    }
  },
});

// 工具 2: 添加收藏
export const addBookmarkTool = new DynamicStructuredTool({
  name: "add_bookmark",
  description: "收藏具体的文章或页面。title 可以为空字符串，系统会自动提取 URL 最后一级路径。",
  schema: z.object({
    title: z.string().describe("收藏标题，可以为空字符串，系统会自动提取 URL 最后一级路径"),
    url: z.string().describe("网址，支持 {{current_tab}} 标识当前网页"),
    description: z.string().optional().describe("描述（可选）"),
  }),
  func: async ({ title, url, description }) => {
    try {
      // 处理 {{current_tab}}
      if (url === '{{current_tab}}' || title === '{{current_tab}}') {
        const tabInfo = await getCurrentTabInfo();
        if (tabInfo) {
          if (url === '{{current_tab}}') url = tabInfo.url;
          if (title === '{{current_tab}}') title = tabInfo.title;
        }
      }

      // 自动提取路径
      if (!title || title === '') {
        title = extractLastPath(url);
      }

      await window.Storage.addBookmark({ title, url, description: description || '' });
      return `✅ 已收藏：${title}`;
    } catch (error) {
      return `❌ 收藏失败：${error.message}`;
    }
  },
});

// 工具 3: 添加待办
export const addTodoTool = new DynamicStructuredTool({
  name: "add_todo",
  description: "创建待办事项，支持时间、优先级、提醒设置。",
  schema: z.object({
    text: z.string().describe("任务内容"),
    dateType: z.enum(["today", "tomorrow", "thisweek", "other"]).describe("日期类型：today-今天，tomorrow-明天，thisweek-本周，other-其他"),
    startDate: z.string().describe("开始日期，格式 YYYY-MM-DD"),
    reminderEnabled: z.boolean().describe("是否开启提醒"),
    reminderTime: z.string().describe("提醒时间，格式 HH:mm，例如 18:00"),
    priority: z.enum(["low", "medium", "high"]).describe("优先级：low-低，medium-中，high-高"),
  }),
  func: async (data) => {
    try {
      await window.Todo.addByAI(data);
      return `✅ 已创建待办：${data.text}`;
    } catch (error) {
      return `❌ 创建待办失败：${error.message}`;
    }
  },
});

// 工具 4: 添加提示词
export const addPromptTool = new DynamicStructuredTool({
  name: "add_prompt",
  description: "添加提示词到提示词库。",
  schema: z.object({
    title: z.string().describe("提示词标题"),
    content: z.string().describe("提示词内容"),
    tags: z.array(z.string()).describe("标签列表，例如 ['编程', '效率']"),
  }),
  func: async (data) => {
    try {
      await window.Prompt.addByAI(data);
      return `✅ 已添加提示词：${data.title}`;
    } catch (error) {
      return `❌ 添加提示词失败：${error.message}`;
    }
  },
});

// 工具 5: 添加指令
export const addCmdTool = new DynamicStructuredTool({
  name: "add_cmd",
  description: "添加指令到指令集。",
  schema: z.object({
    title: z.string().describe("指令名称"),
    code: z.string().describe("指令内容"),
  }),
  func: async (data) => {
    try {
      await window.Command.addByAI(data);
      return `✅ 已添加指令：${data.title}`;
    } catch (error) {
      return `❌ 添加指令失败：${error.message}`;
    }
  },
});

// 工具 6: 保存用户信息
export const saveUserProfileTool = new DynamicStructuredTool({
  name: "save_user_profile",
  description: "保存用户的个人信息（姓名、性别等）。当用户告诉你ta的名字或性别时使用此工具。",
  schema: z.object({
    name: z.string().optional().describe("用户的姓名，如果用户没有提供则不传"),
    gender: z.string().optional().describe("用户的性别，男/女，如果用户没有提供则不传"),
  }),
  func: async (data) => {
    try {
      const currentProfile = await window.Storage.getUserProfile() || {};
      const updatedProfile = {
        name: data.name || currentProfile.name || '',
        gender: data.gender || currentProfile.gender || '',
      };
      await window.Storage.setUserProfile(updatedProfile);
      return `✅ 已保存用户信息：${data.name ? `姓名=${data.name}` : ''}${data.gender ? ` 性别=${data.gender}` : ''}`;
    } catch (error) {
      return `❌ 保存用户信息失败：${error.message}`;
    }
  },
});

// 导出所有工具
export const allTools = [
  addNavTool,
  addBookmarkTool,
  addTodoTool,
  addPromptTool,
  addCmdTool,
  saveUserProfileTool,
];
