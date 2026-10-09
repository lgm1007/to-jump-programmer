#!/usr/bin/env bash
# Piston 에 To Jump Programmer 가 사용하는 런타임(Java 15.0.2, GCC 10.2.0)을 설치한다.
# docker compose up -d 로 서버를 띄운 뒤 이 폴더에서 한 번 실행하세요.
set -euo pipefail
cd "$(dirname "$0")"

# Piston 은 외부에 노출하지 않으므로 같은 네트워크의 caddy 컨테이너(busybox wget)로 내부 API 를 호출한다.
api() {
  docker compose exec -T caddy wget -qO- "$@"
}

install() {
  local language="$1" version="$2"
  echo "▶ ${language} ${version} 설치 중... (수 분 걸릴 수 있어요)"
  api --header 'Content-Type: application/json' \
    --post-data "{\"language\":\"${language}\",\"version\":\"${version}\"}" \
    http://piston:2000/api/v2/packages
  echo
}

install java 15.0.2
install gcc 10.2.0

echo "▶ 설치된 런타임"
api http://piston:2000/api/v2/runtimes
echo
