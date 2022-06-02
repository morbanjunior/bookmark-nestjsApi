import { INestApplication, ValidationPipe } from '@nestjs/common';
import {Test} from '@nestjs/testing';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';
import * as pactum from 'pactum';
import { AuthDto } from '../src/auth/dto';
import { EditUserDto } from '../src/user/dto';
import { CreateBookmarkDto, EditBookmarkDto } from 'src/bookmark/dto';

describe('App e2e', ()=>{
  let app: INestApplication
  let prisma: PrismaService
  beforeAll(async () =>{
    
    const moduleRef = await Test.createTestingModule({
       imports: [AppModule],
    }).compile();

     app = moduleRef.createNestApplication();
     app.useGlobalPipes(new ValidationPipe({
      whitelist:true,
    }),

    );
    await app.init();
    await app.listen(5000);

    prisma =  app.get(PrismaService)

    await prisma.cleanDb();
    pactum.request.setBaseUrl('http://localhost:5000')
  });
  afterAll(()=>{
    app.close();
  })
 

  describe('Auth', ()=>{
    const dto:AuthDto ={
      email: 'morbanjunior@gmail.com',
      password: '123'
    }
    describe('Signup', ()=>{
      it('shold throw if email empty', ()=>{
        return pactum
            .spec()
            .post(
              '/auth/signup',
            ).withBody({
              password: dto.password
            })
            .expectStatus(400)
      })

      it('shold throw if password empty', ()=>{
        return pactum
            .spec()
            .post(
              '/auth/signup',
            ).withBody({
              email: dto.email
            })
            .expectStatus(400)
      })

      it('shold throw if emal and password are empty', ()=>{
        return pactum
            .spec()
            .post(
              '/auth/signup',
            )
            .expectStatus(400)
      })
       
      it('should signup', ()=>{
        
        return pactum
            .spec()
            .post(
              '/auth/signup',
            ).withBody(dto)
            .expectStatus(201)
      })
    });

    describe('Signin', ()=>{
      it('shold throw if email empty', ()=>{
        return pactum
            .spec()
            .post(
              '/auth/signin',
            ).withBody({
              password: dto.password
            })
            .expectStatus(400)
      })

      it('shold throw if password empty', ()=>{
        return pactum
            .spec()
            .post(
              '/auth/signin',
            ).withBody({
              email: dto.email
            })
            .expectStatus(400)
      })

      it('shold throw if emal and password are empty', ()=>{
        return pactum
            .spec()
            .post(
              '/auth/signin',
            )
            .expectStatus(400)
      })
      it('should signin', ()=>{
        return pactum
            .spec()
            .post(
              '/auth/signin',
            ).withBody(dto)
            .expectStatus(200)
            .stores('userAt', 'acces_token')
      })
    });
  });

  describe('User', ()=>{
    describe('Get me', ()=>{
      it('should get current user', ()=>{
        return pactum
        .spec()
        .get(
          '/users/me',
        )
        .withHeaders({
          Authorization: 'Bearer $S{userAt}'
        })
        .expectStatus(200)
      })
    });
    describe('Edit user', ()=>{
      it('should edit  user', ()=>{
        const dto: EditUserDto = {
          firstName: "Ramon Morban",
          email: 'ramorban@gmail.com',
        }
        return pactum
        .spec()
        .patch(
          '/users',
        )
        .withHeaders({
          Authorization: 'Bearer $S{userAt}'
        }).withBody(dto)
        .expectStatus(200)
        .expectBodyContains(dto.firstName)
        .expectBodyContains(dto.email)
      })
    });
  });

  describe('Bookmarks', ()=>{
    describe('Get emply bookmark', ()=>{
      it('should get emply bookmarks', ()=>{
        return pactum
        .spec()
        .get(
          '/bookmarks',
        )
        .withHeaders({
          Authorization: 'Bearer $S{userAt}'
        })
        .expectStatus(200).expectBody([])
      })
    });


    describe('Create bookmark', ()=>{
      const dto: CreateBookmarkDto = {
        title: 'First Bookmark',
        link: 'https://wwww.google.com'
      }
      it('should create bookmark', ()=>{
        return pactum
        .spec()
        .post(
          '/bookmarks',
        )
        .withHeaders({
          Authorization: 'Bearer $S{userAt}'
        })
        .withBody(dto)
        .expectStatus(201)
        .stores('bookmarkId', 'id')
        
      })
    });
    describe('Get bookmark', ()=>{
      it('should get  bookmarks', ()=>{
        return pactum
        .spec()
        .get(
          '/bookmarks',
        )
        .withHeaders({
          Authorization: 'Bearer $S{userAt}'
        })
        .expectStatus(200)
        .expectJsonLength(1)
      })
    });
    describe('Get bookmark by id', ()=>{
      it('should get  bookmarks by id', ()=>{
        return pactum
        .spec()
        .get(
          '/bookmarks/{id}',
        )
        .withPathParams('id', '$S{bookmarkId}')
        .withHeaders({
          Authorization: 'Bearer $S{userAt}'
        })
        .expectStatus(200)
        .expectBodyContains('$S{bookmarkId}')
      })
    });

    describe('Edit bookmark by id', ()=>{
      const dto: EditBookmarkDto = {
        title: 'Ramon Bookmark',
        description: 'El senor de los anillos'
      }
      it('should Edit  bookmarks ', ()=>{
        return pactum
        .spec()
        .patch(
          '/bookmarks/{id}',
        )
        .withPathParams('id', '$S{bookmarkId}')
        .withHeaders({
          Authorization: 'Bearer $S{userAt}'
        })
        .withBody(dto)
        .expectStatus(200)
        .expectBodyContains(dto.description)
        .expectBodyContains(dto.title)
      })
    });

    describe('Delete bookmark by id', ()=>{
      it('should delete  bookmarks ', ()=>{
        return pactum
        .spec()
        .delete(
          '/bookmarks/{id}',
        )
        .withPathParams('id', '$S{bookmarkId}')
        .withHeaders({
          Authorization: 'Bearer $S{userAt}'
        })
        .expectStatus(204)
      });

      it('should get  empty bookmarks', ()=>{
        return pactum
        .spec()
        .get(
          '/bookmarks',
        )
        .withHeaders({
          Authorization: 'Bearer $S{userAt}'
        })
        .expectStatus(200)
        .expectJsonLength(0)
      })
    });
  });
}) 