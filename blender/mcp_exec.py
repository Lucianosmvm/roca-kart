"""Send Python code to the live Blender MCP add-on (socket localhost:9876, 'execute_code').

Usage: python blender/mcp_exec.py <file.py | -c "code"> [timeout_s]
"""
import json, socket, sys


def send(cmd, params, timeout=600):
    s = socket.create_connection(("127.0.0.1", 9876), timeout=10)
    s.sendall(json.dumps({"type": cmd, "params": params}).encode())
    s.settimeout(timeout)
    buf = b""
    while True:
        chunk = s.recv(1 << 16)
        if not chunk:
            break
        buf += chunk
        try:
            return json.loads(buf)
        except json.JSONDecodeError:
            continue
    return json.loads(buf)


if __name__ == "__main__":
    if sys.argv[1] == "-c":
        code = sys.argv[2]; rest = sys.argv[3:]
    else:
        code = open(sys.argv[1], encoding="utf8").read(); rest = sys.argv[2:]
    r = send("execute_code", {"code": code}, float(rest[0]) if rest else 600)
    res = r.get("result", r)
    print(r.get("status"), (res.get("result") if isinstance(res, dict) else res) or "", (r.get("message") or ""))
