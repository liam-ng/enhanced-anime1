# Enhanced Anime1

![](/assets/screenshot.png)

一款适用于 [anime1.me](https://anime1.me/) 网站的增强型浏览器插件，支持 chrome、firefox。
Forked from iyume's Enhanced Anime1.

## New

- Delete history button
- Bangumi info card

## Data Migration
1. In Firefox, Open about:debugging → This Firefox → find your extension → Inspect.
2. In the source console, run the following:
``` 
browser.storage.local.get(null).then(data => console.log(data)) 
```
3. Right-click `Object { Anime1Episodes: (623) […], WidgetPosition: {…} }` to copy object
4. In the destination console, run the following with $temp0 replaced. maybe global variable works? 
```
browser.storage.local.set($temp0) 
```
