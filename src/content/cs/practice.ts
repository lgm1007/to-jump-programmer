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
      choices: [
        'main 브랜치에 feature의 커밋들이 합쳐진다',
        '두 브랜치를 합치는 merge commit이 feature에 하나 생긴다',
        'feature의 커밋들이 main의 최신 커밋 뒤에 새 해시로 다시 적용된다',
        'feature 커밋들의 해시는 그대로 두고 순서만 바뀐다',
      ],
      answer: 2,
      explanation: `rebase는 feature에만 있는 커밋들을 main의 끝에 **하나씩 다시 적용(replay)**합니다. 커밋 해시는 부모 커밋 정보까지 포함해 계산되므로, 다시 적용된 커밋은 **새 해시**를 갖습니다.

\`\`\`text
rebase 전
main:    A - B - C
feature: A - D - E

rebase 후
feature: A - B - C - D' - E'
\`\`\`

- main 브랜치는 바뀌지 않습니다. main에 반영하려면 이후 main에서 병합해야 합니다.
- merge commit을 만드는 것은 \`git merge\`입니다.
- 이력을 다시 쓰므로, 이미 push해서 다른 사람과 공유한 커밋은 rebase하지 않는 것이 원칙입니다.`,
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
      choices: [
        '`git reset --hard a1b2c3d~1` 후 `git push --force`',
        '`git revert a1b2c3d` 후 push',
        '`git commit --amend`로 커밋을 수정한 후 push',
        '`git cherry-pick a1b2c3d` 후 push',
      ],
      answer: 1,
      explanation: `\`git revert\`는 대상 커밋의 변경을 **되돌리는 새 커밋**을 만듭니다. 기존 이력을 지우지 않으므로 강제 push가 필요 없고, 팀원의 로컬 이력과도 충돌하지 않습니다.

- \`reset --hard\` 후 강제 push는 원격 이력을 다시 써서, 이미 받아 간 팀원의 이력과 어긋나게 만듭니다. 보통 main은 브랜치 보호 규칙으로 강제 push가 막혀 있습니다.
- \`--amend\`는 마지막 커밋을 새 커밋으로 바꾸는 것이라 역시 이력 재작성이고, 대상 커밋이 마지막 커밋이 아닐 수도 있습니다.
- \`cherry-pick\`은 커밋을 취소하는 것이 아니라 같은 변경을 한 번 더 적용합니다.

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
        'reset과 revert는 어떻게 다른가요?',
        'rebase 도중 충돌이 나면 어떻게 처리하나요?',
        'squash merge의 장단점은?',
      ],
    },
  ],
};

export default content;
