#!/usr/bin/env bash
# Piston 에 To Jump Programmer 가 사용하는 런타임(Java 15.0.2, Kotlin 1.8.20, GCC 10.2.0)을 설치한다.
# docker compose up -d 로 서버를 띄운 뒤 이 폴더에서 한 번 실행하세요.
set -euo pipefail
cd "$(dirname "$0")"

# Piston 은 외부에 노출하지 않으므로 같은 네트워크의 caddy 컨테이너(busybox wget)로 내부 API 를 호출한다.
api() {
  docker compose exec -T caddy wget -qO- "$@"
}

# 이미 설치된 패키지를 다시 설치하면 Piston 이 오류(Already installed)를 내므로 건너뛴다.
# (운영 중인 서버에 새 런타임만 추가할 때도 이 스크립트를 그대로 다시 실행하면 된다)
RUNTIMES="$(api http://piston:2000/api/v2/runtimes)"

install() {
  local language="$1" version="$2"
  if [[ "$RUNTIMES" == *"\"language\":\"${language}\",\"version\":\"${version}\""* ]]; then
    echo "✓ ${language} ${version} 이미 설치됨"
    return
  fi
  echo "▶ ${language} ${version} 설치 중... (수 분 걸릴 수 있어요)"
  api --header 'Content-Type: application/json' \
    --post-data "{\"language\":\"${language}\",\"version\":\"${version}\"}" \
    http://piston:2000/api/v2/packages
  echo
}

install java 15.0.2
install kotlin 1.8.20   # 패키지 안에 JDK 8 이 함께 들어 있다
install gcc 10.2.0

echo "▶ 설치된 런타임"
api http://piston:2000/api/v2/runtimes
echo
