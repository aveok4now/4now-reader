import { Plugin } from 'obsidian';

export default class Read4sidianPlugin extends Plugin {
  async onload(): Promise<void> {
    console.log('Read4sidian plugin loaded');
  }

  async onunload(): Promise<void> {
    console.log('Read4sidian plugin unloaded');
  }
}
