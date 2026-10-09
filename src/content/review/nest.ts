// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.
import type { ReviewFrameworkContent } from '@/content/types';

const content: ReviewFrameworkContent = {
  patterns: [
    {
      id: 'nest-p-dto-validation',
      framework: 'nest',
      subFramework: 'NestJS',
      category: 'security',
      difficulty: 1,
      title: 'DTO 검증 없이 요청 body 사용',
      summary: 'TypeScript 타입은 런타임에 사라집니다. class-validator로 만든 class DTO와 ValidationPipe로 요청을 검증합니다.',
      problem: `\`@Body() dto: CreateUserDto\`처럼 타입을 붙였으니 안전하다고 생각하기 쉽지만, **TypeScript 타입은 컴파일 후 사라집니다**.

- \`interface\`나 \`type\`으로 만든 DTO는 런타임에 아무것도 검사하지 않습니다.
- 이메일 자리에 숫자가 오거나 나이에 문자열이 와도 그대로 서비스와 DB까지 내려갑니다.
- DTO에 없는 필드(예: \`role\`)도 그대로 통과합니다. 서비스에서 \`{ ...dto }\`로 엔티티를 만들면 클라이언트가 권한 같은 값을 직접 지정할 수 있게 됩니다(mass assignment).`,
      before: {
        language: 'typescript',
        filename: 'users.controller.ts',
        source: `import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from './users.service';

// interface는 컴파일되면 사라져서 런타임 검증이 불가능
export interface CreateUserDto {
  email: string;
  nickname: string;
  age: number;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    // 타입과 다른 값, DTO에 없는 필드도 그대로 전달됨
    return this.usersService.create(dto);
  }
}`,
      },
      after: {
        language: 'typescript',
        filename: 'create-user.dto.ts',
        source: `// create-user.dto.ts
import { IsEmail, IsInt, IsString, Length, Max, Min } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(2, 20)
  nickname!: string;

  @IsInt()
  @Min(14)
  @Max(120)
  age!: number;
}

// main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 검증 데코레이터가 없는 속성 제거
      forbidNonWhitelisted: true, // 제거 대신 400으로 거절
      transform: true, // 검증된 값을 DTO 인스턴스로 변환
    }),
  );
  await app.listen(3000);
}

// users.controller.ts는 그대로: create(@Body() dto: CreateUserDto)`,
      },
      explanation: `### 개선 포인트
- DTO를 **class**로 선언하고 \`class-validator\` 데코레이터로 규칙을 적습니다. \`ValidationPipe\`는 파라미터의 타입 메타데이터로 class를 찾아 검증하는데, \`interface\`는 런타임에 남지 않아 검증 대상이 되지 않습니다.
- 전역 \`ValidationPipe\`를 등록하면 모든 핸들러에 적용되고, 검증에 실패하면 400 응답과 실패 사유가 자동으로 나갑니다.

### 옵션 정리
| 옵션 | 역할 |
|---|---|
| \`whitelist\` | 검증 데코레이터가 없는 속성 제거 |
| \`forbidNonWhitelisted\` | 제거하지 않고 400으로 거절 (\`whitelist\`와 함께 사용) |
| \`transform\` | plain object를 DTO 인스턴스로 변환 |

- \`whitelist\`는 mass assignment를 막는 1차 방어선입니다. 그래도 서비스에서 엔티티를 만들 때는 필요한 필드만 골라 넣는 습관을 함께 가져가세요.
- \`forbidNonWhitelisted\`를 켜면 클라이언트가 여분의 필드를 보내는 순간 400이 납니다. 이미 운영 중인 API에 적용할 때는 영향 범위를 먼저 확인합니다.
- 중첩 객체는 \`@ValidateNested()\`와 \`@Type(() => AddressDto)\`를 함께 붙여야 안쪽까지 검증됩니다.

> \`ValidationPipe\`가 동작하려면 \`class-validator\`와 \`class-transformer\` 패키지가 설치되어 있어야 합니다.`,
      checklist: [
        '`@Body()` 타입이 `interface`나 `any`가 아닌 class DTO인가?',
        '전역 `ValidationPipe`에 `whitelist: true`가 설정되어 있는가?',
        '길이, 범위, 형식 같은 제약이 DTO에 데코레이터로 표현되어 있는가?',
        '중첩 객체와 배열에 `@ValidateNested()`와 `@Type()`이 함께 있는가?',
      ],
    },
    {
      id: 'nest-p-floating-promise',
      framework: 'nest',
      subFramework: 'NestJS',
      category: 'error-handling',
      difficulty: 1,
      title: 'await 누락과 forEach(async)',
      summary: 'await하지 않은 Promise는 실패해도 아무도 처리하지 않습니다. forEach는 async 콜백이 끝나기를 기다리지 않습니다.',
      problem: `게시글 삭제 코드입니다. 응답은 성공으로 나가는데 가끔 삭제가 안 되어 있거나, 서버가 갑자기 재시작되는 일이 생깁니다.

- \`delete()\`에 \`await\`가 없어 **삭제가 끝나기 전에 응답**이 나갑니다. 삭제가 실패해도 클라이언트는 성공으로 압니다.
- \`forEach\`는 콜백이 반환한 값을 버립니다. \`async\` 콜백의 Promise는 **아무도 기다리지 않고, 실패해도 아무도 받지 않습니다**.
- 처리되지 않은 reject(unhandled rejection)는 Node.js 15부터 기본 설정에서 **프로세스를 종료**시킵니다.`,
      before: {
        language: 'typescript',
        filename: 'post.service.ts',
        source: `import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './post.entity';
import { SearchService } from '../search/search.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    private readonly storage: StorageService,
    private readonly search: SearchService,
  ) {}

  async remove(postId: number): Promise<void> {
    const post = await this.postRepo.findOne({
      where: { id: postId },
      relations: { attachments: true },
    });
    if (!post) throw new NotFoundException();

    this.postRepo.delete(postId); // await 누락

    // forEach는 async 콜백이 끝나기를 기다리지 않음
    post.attachments.forEach(async (file) => {
      await this.storage.delete(file.key);
    });

    this.search.removeDocument(postId); // 실패해도 아무도 모름
  }
}`,
      },
      after: {
        language: 'typescript',
        filename: 'post.service.ts',
        source: `import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './post.entity';
import { SearchService } from '../search/search.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    private readonly storage: StorageService,
    private readonly search: SearchService,
  ) {}

  async remove(postId: number): Promise<void> {
    const post = await this.postRepo.findOne({
      where: { id: postId },
      relations: { attachments: true },
    });
    if (!post) throw new NotFoundException();

    // 핵심 작업: 끝까지 기다리고, 실패하면 예외가 호출자에게 전파
    await this.postRepo.delete(postId);

    // 부가 작업: 응답을 늦추지 않게 기다리지 않되, 실패는 반드시 기록
    this.cleanUp(post).catch((e: Error) => {
      this.logger.error(\`게시글 정리 실패: post=\${postId}\`, e.stack);
    });
  }

  private async cleanUp(post: Post): Promise<void> {
    // forEach 대신 map + Promise.all: 모두 끝날 때까지 기다림
    await Promise.all([
      ...post.attachments.map((file) => this.storage.delete(file.key)),
      this.search.removeDocument(post.id),
    ]);
  }
}`,
      },
      explanation: `### 개선 포인트
- 결과가 꼭 필요한 작업은 \`await\`합니다. 실패하면 예외가 전파되어 Nest 예외 필터가 에러 응답을 만듭니다.
- 여러 비동기 작업을 기다릴 때는 \`forEach\` 대신 \`map\` + \`Promise.all\`을 씁니다. 순서대로 처리해야 한다면 \`for...of\` 안에서 \`await\`합니다.
- 응답을 늦출 필요가 없는 부가 작업은 기다리지 않아도 되지만, 반드시 \`.catch()\`를 붙여 실패를 처리합니다.

### 왜 서버가 재시작될까?
\`await\`도 \`.catch()\`도 없는 Promise가 reject되면 \`unhandledRejection\`이 발생합니다. Node.js 15부터 기본 동작이 \`throw\` 모드라서 별도 처리기가 없으면 uncaught exception으로 바뀌고 **프로세스가 종료**됩니다. 그 순간 처리 중이던 다른 요청도 함께 실패합니다.

### 트레이드오프
- 기다리지 않는 작업은 서버가 재시작되면 유실될 수 있습니다. 반드시 실행돼야 하는 작업이라면 BullMQ 같은 작업 큐로 옮기는 것을 검토합니다.
- 이런 실수는 사람보다 도구가 더 잘 잡습니다. \`@typescript-eslint/no-floating-promises\`, \`no-misused-promises\` 규칙을 켜 두세요.`,
      checklist: [
        '`async` 함수 호출마다 `await`, `return`, `.catch()` 중 하나가 있는가?',
        '`forEach`에 `async` 콜백을 넘기고 있지 않은가?',
        '일부러 기다리지 않는 작업에도 에러 처리와 로그가 있는가?',
        '`no-floating-promises` 린트 규칙이 켜져 있는가?',
      ],
    },
  ],
  challenges: [
    {
      id: 'nest-c01',
      framework: 'nest',
      subFramework: 'NestJS',
      difficulty: 1,
      title: '회원가입 API 리뷰',
      context: `신규 서비스의 이메일 회원가입 API입니다.

- \`POST /users/signup\`으로 이메일, 비밀번호, 닉네임을 받아 회원을 생성합니다.
- 이메일은 중복될 수 없고, 비밀번호는 bcrypt로 해시해 저장합니다.
- \`User\` 엔티티에는 \`role\` 컬럼(\`USER\` 또는 \`ADMIN\`, 기본값 \`USER\`)이 있습니다.
- 모바일 앱은 가입 응답으로 받은 회원 정보로 프로필 화면을 그립니다.
- 환경: NestJS 10, TypeORM 0.3, MySQL 8`,
      code: {
        language: 'typescript',
        filename: 'signup.ts',
        source: `import { Body, Controller, Injectable, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from './user.entity';

export interface SignUpDto {
  email: string;
  password: string;
  nickname: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async signUp(dto: SignUpDto): Promise<User> {
    const found = await this.userRepo.findOneBy({ email: dto.email });
    if (found) {
      throw new Error('이미 가입된 이메일입니다.');
    }

    const hashed = bcrypt.hashSync(dto.password, 12);
    const user = this.userRepo.create({ ...dto, password: hashed });
    return this.userRepo.save(user);
  }
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('signup')
  async signUp(@Body() dto: SignUpDto) {
    const user = await this.usersService.signUp(dto);
    return user;
  }
}`,
      },
      issues: [
        {
          lines: [
            7,
            27,
            37,
          ],
          category: 'security',
          severity: 'critical',
          title: '요청 body를 검증하지 않아 role까지 저장될 수 있음',
          description: `\`SignUpDto\`가 \`interface\`라서 런타임에는 아무 검증도 일어나지 않습니다.

- 이메일 형식이 아니거나 비밀번호가 빈 값이어도 그대로 처리됩니다.
- \`{ ...dto }\`로 엔티티를 만들기 때문에 body에 \`role\` 필드를 함께 보내면 그 값이 그대로 저장됩니다. 누구나 관리자 계정을 만들 수 있습니다.`,
          suggestion: `DTO를 class로 바꾸고 \`class-validator\`로 규칙을 선언한 뒤, 전역 \`ValidationPipe\`에 \`whitelist: true\`를 켭니다. 엔티티를 만들 때도 필요한 필드만 골라 넣습니다.

\`\`\`typescript
export class SignUpDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(8, 64)
  password!: string;

  @IsString()
  @Length(2, 20)
  nickname!: string;
}
\`\`\``,
        },
        {
          lines: [
            28,
            39,
          ],
          category: 'security',
          severity: 'critical',
          title: '응답에 비밀번호 해시가 그대로 노출됨',
          description: `\`save()\`가 반환한 엔티티를 그대로 응답하므로 \`password\` 컬럼(해시값)까지 클라이언트로 내려갑니다.

- 해시값이라도 유출되면 오프라인에서 비밀번호를 추측하는 공격의 재료가 됩니다.
- 엔티티에 컬럼이 추가될 때마다 의도하지 않은 정보가 함께 노출될 위험이 있습니다.`,
          suggestion: `엔티티 대신 응답 전용 객체를 만들어 필요한 필드만 반환합니다.

\`\`\`typescript
return { id: user.id, email: user.email, nickname: user.nickname };
\`\`\`

\`ClassSerializerInterceptor\`와 \`@Exclude()\`를 쓰는 방법도 있지만, 응답 타입을 명시적으로 분리하는 편이 실수가 적습니다.`,
        },
        {
          lines: [
            26,
          ],
          category: 'performance',
          severity: 'major',
          title: '동기 해시 함수가 이벤트 루프를 막음',
          description: '`bcrypt.hashSync`는 cost 12 기준으로 수백 ms 가까이 메인 스레드를 점유할 수 있습니다. 그동안 서버는 다른 요청을 전혀 처리하지 못해, 가입이 몰리면 **가입과 무관한 API까지 함께 느려집니다**.',
          suggestion: `비동기 버전을 \`await\`합니다. 해시 계산이 libuv 스레드 풀에서 실행되어 이벤트 루프가 막히지 않습니다.

\`\`\`typescript
const hashed = await bcrypt.hash(dto.password, 12);
\`\`\``,
        },
        {
          lines: [
            23,
          ],
          category: 'error-handling',
          severity: 'major',
          title: '중복 이메일에 일반 Error를 던져 500으로 응답',
          description: `Nest는 \`HttpException\`이 아닌 에러를 모두 500 Internal Server Error로 응답합니다.

- 앱은 "이미 가입된 이메일"과 서버 장애를 구분할 수 없어 사용자에게 알맞은 안내를 보여 주지 못합니다.
- 정상적인 사용자 실수가 서버 에러로 집계되어 모니터링과 알림이 오염됩니다.`,
          suggestion: `상황에 맞는 HTTP 예외(409 Conflict)를 던집니다.

\`\`\`typescript
throw new ConflictException('이미 가입된 이메일입니다.');
\`\`\`

같은 이메일로 동시에 가입하는 경우까지 막으려면 \`email\` 컬럼에 unique 제약을 두고, 중복 키 에러도 409로 변환합니다.`,
        },
      ],
      question: {
        prompt: '이 코드에서 개선이 필요한 점을 모두 고르세요.',
        options: [
          {
            text: '비밀번호를 해시하지 않고 평문으로 저장한다',
            correct: false,
          },
          {
            text: '요청 body를 런타임에 검증하지 않아 `role` 같은 필드까지 저장될 수 있다',
            correct: true,
          },
          {
            text: '동기 해시 함수가 실행되는 동안 다른 요청이 처리되지 않는다',
            correct: true,
          },
          {
            text: '이메일 중복 확인 쿼리가 반복문 안에서 실행되어 N+1 문제가 생긴다',
            correct: false,
          },
          {
            text: '가입 응답에 비밀번호 해시가 포함된다',
            correct: true,
          },
          {
            text: '이메일이 중복되면 409가 아닌 500으로 응답한다',
            correct: true,
          },
        ],
      },
      improved: {
        language: 'typescript',
        filename: 'signup.ts',
        source: `import {
  Body,
  ConflictException,
  Controller,
  Injectable,
  Post,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { IsEmail, IsString, Length } from 'class-validator';
import { Repository } from 'typeorm';
import { User } from './user.entity';

// class여야 ValidationPipe가 런타임에 검증할 수 있음
// main.ts: new ValidationPipe({ whitelist: true }) 전역 등록
export class SignUpDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(8, 64)
  password!: string;

  @IsString()
  @Length(2, 20)
  nickname!: string;
}

export interface SignUpResponse {
  id: number;
  email: string;
  nickname: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async signUp(dto: SignUpDto): Promise<SignUpResponse> {
    const found = await this.userRepo.findOneBy({ email: dto.email });
    if (found) {
      // 동시 가입까지 막으려면 unique 제약 + 중복 키 에러도 409로 변환
      throw new ConflictException('이미 가입된 이메일입니다.');
    }

    // 비동기 해시: 계산은 스레드 풀에서, 이벤트 루프는 계속 동작
    const hashed = await bcrypt.hash(dto.password, 12);
    // 필요한 필드만 골라 엔티티 생성 (role은 기본값 USER)
    const user = await this.userRepo.save(
      this.userRepo.create({
        email: dto.email,
        nickname: dto.nickname,
        password: hashed,
      }),
    );
    // 엔티티 대신 응답 전용 객체 반환
    return { id: user.id, email: user.email, nickname: user.nickname };
  }
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('signup')
  signUp(@Body() dto: SignUpDto): Promise<SignUpResponse> {
    return this.usersService.signUp(dto);
  }
}`,
      },
      summary: `### 총평
회원가입은 외부 입력이 가장 먼저 들어오는 곳이라 **입력 → 처리 → 실패 → 출력** 순서로 점검하면 빠짐없이 리뷰할 수 있습니다.

- 입력: class DTO + \`ValidationPipe({ whitelist: true })\`
- 처리: 비동기 \`bcrypt.hash()\`
- 실패: 상황에 맞는 HTTP 예외(409)
- 출력: 엔티티 대신 응답 전용 객체

### 리뷰 코멘트 작성 팁
- **문제 → 영향 → 제안** 순서로 씁니다. 예: "\`hashSync\`는 메인 스레드를 수백 ms 점유해서 가입이 몰리면 다른 API도 멈출 수 있습니다. \`await bcrypt.hash()\`로 바꾸면 좋겠습니다."
- 심각도를 함께 적어 주세요. 비밀번호 해시 노출처럼 반드시 고쳐야 하는 문제와 취향 차이를 구분하면 작성자가 우선순위를 정하기 쉽습니다.`,
    },
  ],
};

export default content;
