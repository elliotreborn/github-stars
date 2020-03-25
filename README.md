<div align='center'>

<img src="https://github-stars.socode.pro/logo.svg" alt="logo" width="100" />

### Github Stars
  ✨github repo's star growth chart  
  [**Explore Demo »**](https://github-stars.socode.pro/)

  [report bug](https://github.com/elliotreborn/github-stars/issues) · 
  [request feature](https://spectrum.chat/github-stars/request-feature) · 
  [keep touch (Discord)](https://discordapp.com/invite/KSyk3BB)
  <!-- <a href="https://chrome.google.com/webstore/detail/socode-search/hlkgijncpebndijijbcakkcefmpniacd">browser extension</a>· -->

  ![Test](https://github.com/elliotreborn/github-stars/workflows/Test/badge.svg?branch=master)
  ![Build](https://github.com/elliotreborn/github-stars/workflows/Build/badge.svg?branch=master)
  ![Dependencies](https://img.shields.io/david/elliotreborn/github-stars)
  ![Dev Dependencies](https://img.shields.io/david/dev/elliotreborn/github-stars)
  ![License](https://img.shields.io/github/license/elliotreborn/github-stars)

  ![Demo](https://github-stars.socode.pro/github-stars.gif)
</div>

## Introduction

Inspired by the [timqian/star-history](https://github.com/timqian/star-history).  
The project extension implements the comparison of star trend data for multiple GitHub repository in the technology stack.
You can easily add the technology stack-related repositories you understand and download chart image.

<!-- ## Browser Extension

A hyperlink to create a github-stars chart appears on the github.com repository page.
If the current github.com repository exists in a github-stars stack, a button appears showing the stack comparison chart. -->

## Quick Start

configure your REACT_APP_GITHUB_TOKENS environment variable in .env.development

```bash
npm install
npm start
```
<!-- npm start_ext # start develop browser extension -->

## About Cache

This project can use full functionality without remote caching. However, it is strongly recommended that users build their own caching service. Reduce the frequency of using github token and avoid causing trouble to github.com. Just configure it in .env*:
```bash
REACT_APP_CATCH_POST (submit cache data API).
REACT_APP_CATCH (get cache data api).
REACT_APP_CATCH_CN (get cache data api in China)
```
[You can see](https://github.com/elliotreborn/github-stars/blob/master/src/services/historyCache.service.ts) how these environment variables are used.

## About Github Token

Data for each repository star history requires a maximum of 30 github api requests. There can only make up to 60 requests per hour without github authentication. So we need to guide the user OAuth to get the token for requests, each user's github token can make up to 5000 requests per hour. [more information](https://developer.github.com/v3/#rate-limiting).

At present, this project uses the very simple [netlify.com oauth](https://docs.netlify.com/visitor-access/oauth-provider-tokens/) solution, does not request any scope permissions. And there is no remote storage token, only local cache.
