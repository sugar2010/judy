var app = require('../app')
var request = require('supertest')
var User = require('../models/user')
var Tileset = require('../models/tileset')
var should = require('chai').should() // eslint-disable-line no-unused-vars

describe('瓦片集模块', function(){
  var access_token
  var tileset_id

  before('注册用户', function(done){
    request(app)
      .post('/api/v1/users')
      .send({ username: 'nick', password: '123456'})
      .expect(200)
      .end(function(err, res){
        if(err){
          return done(err)
        }

        User.findOneAndUpdate({ username: 'nick' }, { is_verified: true }
          , { new: true }, function(err) {
            if (err) {
              return done(err)
            }
          })

        access_token = res.body.access_token

        done()
      })
  })

  after('清理', function(done){
    User.remove({ username: 'nick'}).exec(function(){
      Tileset.remove({ owner: 'nick'}).exec(function(){
        done()
      })
    })
  })

  describe('上传瓦片集', function(){
    afterEach('yes', function(done){
      this.timeout(4100)
      setTimeout(function(){
        done()
      },4000)
    })

    it('上传成功', function(done){
      this.timeout(10000)
      request(app)
        .post('/api/v1/tilesets/nick')
        .set('x-access-token', access_token)
        .attach('upload', './test/fixtures/beijing.mbtiles')
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.owner.should.equal('nick')
          res.body.tileset_id.should.exist

          tileset_id = res.body.tileset_id

          done()
        })
    })
  })

  describe('获取用户瓦片集列表', function(){
    it('获取成功', function(done){
      request(app)
        .get('/api/v1/tilesets/nick')
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.length.should.above(0)

          done()
        })
    })
  })

  describe('获取瓦片集状态', function(){
    it('获取成功', function(done){
      request(app)
        .get('/api/v1/tilesets/nick/' + tileset_id)
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.owner.should.equal('nick')
          res.body.tileset_id.should.equal(tileset_id)

          done()
        })
    })
  })

  describe('更新瓦片集', function(){
    it('更新成功', function(done){
      request(app)
        .patch('/api/v1/tilesets/nick/' + tileset_id)
        .set('x-access-token', access_token)
        .send({ name: 'newname', owner: 'newowner', scope: 'public', tags: ['tag1', 'tag2']})
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.body.owner.should.equal('nick')
          res.body.name.should.equal('newname')
          res.body.scope.should.equal('public')
          res.body.tags[0].should.equal('tag1')

          done()
        })
    })
  })

  describe('获取瓦片', function(){
    this.timeout(6000)
    it('获取成功', function(done){
      request(app)
        .get('/api/v1/tilesets/nick/' + tileset_id + '/6/52/24.vector.pbf')
        .set('x-access-token', access_token)
        .expect(200)
        .end(function(err, res){
          if(err){
            return done(err)
          }

          res.type.should.equal('application/x-protobuf')

          done()
        })
    })
  })

  describe('删除瓦片集', function(){
    it('删除成功', function(done){
      request(app)
        .delete('/api/v1/tilesets/nick/' + tileset_id)
        .set('x-access-token', access_token)
        .expect(204, done)
    })
  })
})
