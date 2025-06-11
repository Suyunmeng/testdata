const API_URL = 'https://openapi.baidu.com/oauth/2.0/token';

// HTML 内容
const HTML_CONTENT = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>Baidu OAuth 授权码获取</title>
  <style>
    body { font-family: sans-serif; max-width: 600px; margin: 50px auto; }
    input, button { width: 100%; margin: 8px 0; padding: 8px; font-size: 1em; }
    #result { white-space: pre-wrap; background: #f0f0f0; padding: 10px; margin-top: 10px; }
  </style>
</head>
<body>
  <h2>百度授权码获取</h2>
  
  <label>AppKey：</label>
  <input type="text" id="appKey" placeholder="输入你的 AppKey">

  <label>SecretKey：</label>
  <input type="text" id="secretKey" placeholder="输入你的 SecretKey">

  <!-- 指定 type="button"，避免默认 submit 行为 -->
  <button type="button" onclick="getAuthCode()">跳转获取授权码</button>

  <label>输入授权码：</label>
  <input type="text" id="authCode" placeholder="粘贴从百度获取的授权码">

  <button type="button" onclick="getRefreshToken()">获取 refresh_token</button>

  <div id="result"></div>

  <script>
    function getAuthCode() {
      const appKey = document.getElementById('appKey').value.trim();
      if (!appKey) {
        return alert('请先填写 AppKey');
      }
      const url = new URL('https://openapi.baidu.com/oauth/2.0/authorize');
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('client_id', appKey);
      url.searchParams.set('redirect_uri', 'oob');
      url.searchParams.set('scope', 'basic,netdisk');
      window.open(url.toString(), '_blank');
    }

    async function getRefreshToken() {
      const appKey = document.getElementById('appKey').value.trim();
      const secretKey = document.getElementById('secretKey').value.trim();
      const code = document.getElementById('authCode').value.trim();
      if (!appKey || !secretKey || !code) {
        return alert('请确保 AppKey、SecretKey 和 授权码 都已填写！');
      }
      const tokenUrl = '/get_token?code=' + encodeURIComponent(code) +
                       '&client_id=' + encodeURIComponent(appKey) +
                       '&client_secret=' + encodeURIComponent(secretKey);

      try {
        const resp = await fetch(tokenUrl);
        const data = await resp.json();
        if (data.refresh_token) {
          document.getElementById('result').textContent =
            '🎉 获取成功！\\n\\nRefresh Token:\\n' + data.refresh_token;
        } else {
          document.getElementById('result').textContent =
            '❌ 获取失败:\\n' + JSON.stringify(data, null, 2);
        }
      } catch (e) {
        document.getElementById('result').textContent =
          '发生错误:\\n' + e;
      }
    }
  </script>
</body>
</html>
`;

// Worker 入口
addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  if (url.pathname === '/') {
    event.respondWith(new Response(HTML_CONTENT, {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' }
    }));
  } else if (url.pathname === '/get_token') {
    event.respondWith(handleToken(req));
  } else {
    event.respondWith(new Response('Not Found', { status: 404 }));
  }
});

async function handleToken(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const client_id = url.searchParams.get('client_id');
  const client_secret = url.searchParams.get('client_secret');
  if (!code || !client_id || !client_secret) {
    return new Response('Missing parameters', { status: 400 });
  }
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id,
    client_secret,
    redirect_uri: 'oob'
  });
  try {
    const resp = await fetch(API_URL + '?' + params.toString());
    const json = await resp.json();
    if (json.refresh_token) {
      return new Response(JSON.stringify({ refresh_token: json.refresh_token }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify(json), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
  } catch (err) {
    return new Response('Internal Error', { status: 500 });
  }
}
