export default {
  async fetch(request) {
    const url = new URL(request.url);

    // 后端 API：/get_token?code=xxx&client_id=xxx&client_secret=xxx
    if (url.pathname === "/get_token") {
      const code = url.searchParams.get("code");
      const client_id = url.searchParams.get("client_id");
      const client_secret = url.searchParams.get("client_secret");

      if (!code || !client_id || !client_secret) {
        return new Response(JSON.stringify({ error: "缺少参数" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const tokenUrl = `https://openapi.baidu.com/oauth/2.0/token?` +
        new URLSearchParams({
          grant_type: "authorization_code",
          code,
          client_id,
          client_secret,
          redirect_uri: "oob",
        });

      const res = await fetch(tokenUrl);
      const data = await res.json();

      return new Response(JSON.stringify(data), {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      });
    }

    // 默认返回 HTML 页面
    return new Response(
      `
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8" />
  <title>Baidu OAuth 获取 Token</title>
  <style>
    body { font-family: sans-serif; padding: 2em; max-width: 600px; margin: auto; }
    input, button { width: 100%; margin: 8px 0; padding: 8px; font-size: 1em; }
    #result { white-space: pre-wrap; background: #f8f8f8; padding: 1em; margin-top: 1em; }
  </style>
</head>
<body>
  <h2>Baidu OAuth 获取 refresh_token</h2>

  <label>AppKey：</label>
  <input id="appKey" placeholder="输入你的 AppKey">

  <label>SecretKey：</label>
  <input id="secretKey" placeholder="输入你的 SecretKey">

  <button onclick="getAuthCode()">跳转获取授权码</button>

  <label>输入授权码：</label>
  <input id="authCode" placeholder="粘贴从百度获取的授权码">

  <button onclick="getRefreshToken()">获取 refresh_token</button>

  <div id="result"></div>

  <script>
    function getAuthCode() {
      const appKey = document.getElementById("appKey").value;
      const url = new URL("https://openapi.baidu.com/oauth/2.0/authorize");
      url.searchParams.set("response_type", "code");
      url.searchParams.set("client_id", appKey);
      url.searchParams.set("redirect_uri", "oob");
      url.searchParams.set("scope", "basic,netdisk");
      window.open(url.toString(), "_blank");
    }

    async function getRefreshToken() {
      const appKey = document.getElementById("appKey").value;
      const secretKey = document.getElementById("secretKey").value;
      const code = document.getElementById("authCode").value;

      if (!appKey || !secretKey || !code) {
        alert("请填写完整信息！");
        return;
      }

      const url = new URL(location.origin + "/get_token");
      url.searchParams.set("code", code);
      url.searchParams.set("client_id", appKey);
      url.searchParams.set("client_secret", secretKey);

      try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.refresh_token) {
          document.getElementById("result").textContent =
            "🎉 获取成功：\nRefresh Token:\n" + data.refresh_token;
        } else {
          document.getElementById("result").textContent =
            "❌ 获取失败：\n" + JSON.stringify(data, null, 2);
        }
      } catch (e) {
        document.getElementById("result").textContent =
          "请求失败：" + e.toString();
      }
    }
  </script>
</body>
</html>
      `.trim(),
      {
        headers: {
          "Content-Type": "text/html;charset=UTF-8",
        },
      }
    );
  },
};
