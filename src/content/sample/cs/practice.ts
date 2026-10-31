// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.
import type { CsCategoryContent } from '@/content/types';

const content: CsCategoryContent = {
  quiz: [
    {
      id: 'cs-practice-q01',
      categoryId: 'practice',
      type: 'mcq',
      difficulty: 1,
      prompt: 'feature 브랜치에서 다음 명령을 실행했습니다. 결과로 옳은 것은? (충돌은 없다고 가정합니다)',
      code: {
        language: 'bash',
        source: `git switch feature
git rebase main`,
      },
      correct: 'feature의 커밋들이 main의 최신 커밋 뒤에 새 해시로 다시 적용된다',
      distractors: [
        {
          text: 'main 브랜치에 feature의 커밋들이 합쳐진다',
          why: 'rebase는 현재 브랜치인 feature만 바꾸고 main은 그대로 둡니다. main에 반영하려면 이후 main에서 따로 병합해야 합니다.',
        },
        {
          text: '두 브랜치를 합치는 merge commit이 feature에 하나 생긴다',
          why: 'merge commit을 만드는 것은 `git merge`입니다. rebase는 커밋을 하나씩 다시 적용해 merge commit 없는 일직선 이력을 만듭니다.',
        },
        {
          text: 'feature 커밋들의 해시는 그대로 두고 순서만 바뀐다',
          why: '커밋 해시는 부모 커밋 정보까지 포함해 계산되므로, 부모가 바뀐 커밋은 변경 내용이 같아도 새 해시를 갖습니다.',
        },
        {
          text: 'feature의 커밋들이 하나로 합쳐진(squash) 뒤 main의 최신 커밋 뒤에 붙는다',
          why: '`git rebase main`은 커밋을 하나씩 다시 적용할 뿐 합치지 않습니다. 커밋을 합치려면 `git rebase -i`에서 `squash`를 지정합니다.',
        },
        {
          text: 'main의 커밋들이 feature의 최신 커밋 뒤에 새 해시로 다시 적용된다',
          why: '다시 적용되는 쪽은 현재 브랜치(feature)에만 있는 커밋이고, main의 커밋은 그대로 새 기준이 됩니다.',
        },
        {
          text: 'feature에만 있던 커밋들은 버려지고 feature가 main과 같은 커밋을 가리킨다',
          why: 'feature의 커밋은 사라지지 않고 main의 끝에 다시 적용됩니다. 브랜치를 main 위치로 옮기기만 하는 것은 `git reset --hard main`입니다.',
        },
      ],
      explanation: `rebase는 feature에만 있는 커밋들을 main의 끝에 **하나씩 다시 적용(replay)**합니다. 커밋 해시는 부모 커밋 정보까지 포함해 계산되므로, 다시 적용된 커밋은 **새 해시**를 갖습니다.

\`\`\`text
rebase 전
main:    A - B - C
feature: A - D - E

rebase 후
feature: A - B - C - D' - E'
\`\`\`

이력을 다시 쓰므로, 이미 push해서 다른 사람과 공유한 커밋은 rebase하지 않는 것이 원칙입니다.`,
      tags: [
        'Git',
        'rebase',
        'merge',
      ],
    },
    {
      id: 'cs-practice-q02',
      categoryId: 'practice',
      type: 'mcq',
      difficulty: 1,
      prompt: '이미 원격 main에 push되어 팀원들도 받아 간 커밋 `a1b2c3d`의 변경을 취소하려 합니다. 가장 안전한 방법은?',
      correct: '`git revert a1b2c3d` 후 push',
      distractors: [
        {
          text: '`git reset --hard a1b2c3d~1` 후 `git push --force`',
          why: '원격 이력을 다시 써서 이미 받아 간 팀원의 이력과 어긋나고, `a1b2c3d` 뒤에 쌓인 다른 커밋까지 사라집니다. 보통 main은 브랜치 보호 규칙으로 강제 push가 막혀 있습니다.',
        },
        {
          text: '`git commit --amend`로 커밋을 수정한 후 push',
          why: '`--amend`는 마지막 커밋을 새 커밋으로 바꾸는 이력 재작성이라 일반 push는 거부되고, 대상 커밋이 마지막 커밋이 아닐 수도 있습니다.',
        },
        {
          text: '`git cherry-pick a1b2c3d` 후 push',
          why: '`cherry-pick`은 커밋의 변경을 한 번 더 적용하는 명령이라 취소와 반대입니다. 이미 main에 있는 커밋이면 바뀌는 내용이 없어 빈 커밋으로 멈춥니다.',
        },
        {
          text: '로컬에서 `git reset --hard a1b2c3d~1`만 하고 push는 하지 않는다',
          why: '내 로컬 브랜치만 되돌아갈 뿐, 원격 main과 팀원들의 저장소에는 그 커밋이 그대로 남습니다.',
        },
        {
          text: '`git rebase -i`로 `a1b2c3d`를 `drop`한 뒤 강제 push',
          why: '커밋을 빼고 그 뒤 커밋들을 새 해시로 다시 쓰는 이력 재작성이라, 이미 받아 간 팀원의 이력과 어긋나고 강제 push가 필요합니다.',
        },
      ],
      explanation: `\`git revert\`는 대상 커밋의 변경을 **되돌리는 새 커밋**을 만듭니다. 기존 이력을 지우지 않으므로 강제 push가 필요 없고, 팀원의 로컬 이력과도 충돌하지 않습니다.

merge commit을 되돌릴 때는 \`git revert -m 1 <merge-commit>\`처럼 기준이 될 부모를 지정합니다.`,
      tags: [
        'Git',
        'revert',
        'reset',
      ],
    },
  ],
  cards: [
    {
      id: 'cs-practice-c01',
      categoryId: 'practice',
      difficulty: 1,
      question: 'Git에서 merge와 rebase의 차이는 무엇이고, 각각 언제 사용하나요?',
      answer: `- **merge**: 두 브랜치의 이력을 그대로 두고 merge commit으로 합칩니다. 실제 작업 흐름이 보존되고 기존 커밋을 바꾸지 않아 공유 브랜치에서도 안전합니다. 대신 merge commit이 많아지면 이력 그래프가 복잡해집니다.
- **rebase**: 내 커밋을 대상 브랜치의 끝으로 옮겨 다시 적용해 일직선(선형) 이력을 만듭니다. 이 과정에서 커밋 해시가 새로 만들어집니다(이력 재작성).

원칙은 "이미 push해서 다른 사람과 공유한 커밋은 rebase하지 않는다"입니다. 그래서 로컬 작업 브랜치를 최신 main에 맞추거나 PR 전에 \`rebase -i\`로 커밋을 정리할 때는 rebase를, 공유 브랜치를 합칠 때는 merge를 씁니다. 팀 차원에서는 PR 병합 방식(merge commit, squash, rebase merge)을 하나로 정해 이력을 일관되게 유지합니다.`,
      keywords: [
        'merge commit',
        '선형 이력',
        '커밋 해시 재작성',
        '공유 브랜치 원칙',
        'squash merge',
      ],
      followUps: [
        {
          question: 'reset과 revert는 어떻게 다른가요?',
          answer: '`reset` 은 브랜치 포인터를 과거 커밋으로 옮겨 그 뒤의 커밋을 브랜치에서 빼는 **이력 재작성**이고, `revert` 는 지정한 커밋의 변경을 반대로 적용한 **새 커밋**을 추가해 기존 이력을 그대로 둡니다. 그래서 아직 push 하지 않은 내 커밋은 `reset` 으로 정리하고, 이미 공유된 커밋은 `revert` 로 취소해 강제 push 없이 팀원 이력과 맞춥니다. `reset` 은 `--soft` · `--mixed` · `--hard` 에 따라 취소한 변경을 staged 로 남길지, unstaged 로 남길지, 지울지가 달라집니다.',
          followUps: [
            {
              question: 'merge commit을 revert하면 어떻게 되나요?',
              answer: 'merge commit 은 부모가 둘이라 `git revert -m 1 <커밋>` 처럼 어느 부모를 기준(보통 main 쪽인 1번)으로 되돌릴지 정해야 합니다. 주의할 점은 그 브랜치의 커밋들이 여전히 이력에 남아 있다는 것입니다. 나중에 고친 브랜치를 다시 merge 해도 되돌린 변경은 돌아오지 않으므로, 먼저 그 revert 커밋을 다시 revert 해야 합니다.',
            },
          ],
        },
        {
          question: 'rebase 도중 충돌이 나면 어떻게 처리하나요?',
          answer: 'rebase 는 커밋을 하나씩 다시 적용하므로 충돌도 커밋 단위로 멈춥니다. 충돌 파일을 고쳐 `git add` 한 뒤 `git rebase --continue` 로 다음 커밋으로 넘어가고, 그 커밋이 필요 없어졌으면 `--skip`, 처음부터 다시 하고 싶으면 `--abort` 로 rebase 전 상태로 돌아갑니다. 커밋이 많아 같은 충돌이 반복되면 먼저 `rebase -i` 로 커밋을 합쳐 두거나 `git rerere` 를 켜서 한 번 해결한 방식을 다시 쓰게 합니다. 충돌을 푼 뒤에는 빌드와 테스트를 돌려 의미상 충돌이 없는지도 확인합니다.',
          followUps: [
            {
              question: 'rebase를 잘못해서 커밋이 꼬였다면 어떻게 되돌리나요?',
              answer: '`git reflog` 에는 HEAD 가 거쳐 간 위치가 남아 있어, rebase 를 시작하기 직전 커밋을 찾아 `git reset --hard <그 커밋>` 으로 되돌릴 수 있습니다. 방금 끝난 rebase 라면 rebase 전 위치를 가리키는 `ORIG_HEAD` 를 써도 됩니다. 다만 `--hard` 는 커밋하지 않은 변경을 지우므로, 작업 중인 변경이 있으면 먼저 stash 해 둡니다.',
            },
          ],
        },
        {
          question: 'squash merge의 장단점은?',
          answer: 'PR 하나가 main 에 커밋 하나로 남아 이력이 깔끔하고, 문제가 생기면 그 커밋 하나만 revert 하면 되는 것이 장점입니다. 오타 수정 같은 중간 커밋이 main 에 섞이지 않는 것도 좋습니다. 대신 PR 안의 세부 커밋이 사라져 `git bisect` 로 원인을 좁힐 때 범위가 커지고, 원래 브랜치의 커밋이 main 의 조상이 아니게 되어 머지한 브랜치에서 계속 작업하면 이미 들어간 변경과 다시 충돌합니다. 그래서 squash 를 쓰는 팀은 PR 을 작게 유지하고, 머지한 브랜치는 지우고 새로 만듭니다.',
        },
      ],
    },
  ],
};

export default content;
