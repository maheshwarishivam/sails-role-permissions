
// External modules
import { Sails }    from 'sails'
import request      from 'supertest'
import sinon        from 'sinon'
import { assert, expect, should }   from 'chai'
should()

// Utils and config
import SailsServer  from '../util/SailsServer'
import mainConfig   from '../config/mainConfig'

// Internal module code
import permissionPolicies from '../../src/policies'
import defaultRoles       from '../../src/config/defaultRoles'

let s = new SailsServer()

const testModel = {
  name : 'testName',
  email : 'testEmail',
  password: 'testPassword',
}

// Authenticate user at each request
function userPolicy(req, res, next){

  if(req.body && req.body.auth === 'user'){
    s.sails.models.user.findOne({name : 'l1br3'})
    .then(user => {
      req.user = user
      // Implicit role
      next()
    })

  }else if(req.body && req.body.auth === 'admin'){
    req.user = {
      role : 'admin',
      id: 'anyway'
    }
    next()

  }else{
    req.user = {} //Implicit roling but not owner
    next()
  }
}

describe('Ownership Integration ::', function(){

  //--------------------
  //------ FIND --------
  //--------------------

  describe('update as owner ::', function() {

    function save(model){
      return new Promise((resolve, reject) => {
        model.save(err => {
          if(err) reject(err)
          resolve()
        })
      })
    }


    let userInDb, testModelInDb, nocontrollerModelInDb

    const config = {
      ...mainConfig,
      policies : {
        '*' : [userPolicy]
      },
      permissions : {
        '*' : 'user', // should allow user to create/update his own profile,
        test : {
          update : {}
        }
      }
    }

    before(function (done) {

      async function lift(){
        try{
          await s.lift(config)
          nocontrollerModelInDb = await s.sails.models.nocontroller.create({name : 'nocontroller'})
          userInDb              = await s.sails.models.user.create({name         : 'l1br3'})
          testModelInDb         = await s.sails.models.test.create(testModel)
          testModelInDb.owner.add(userInDb)
          testModelInDb.nocontroller.add(nocontrollerModelInDb)
          await save(testModelInDb)

        }catch(e){
          return e
        }
      }

      lift()
      .then(done)
      .catch(done)
    })

    after(function (done) {
      s.lower()
      .then(done)
      .catch(done)
    })

    it('should be able to update owned model', function(done){

      request(s.sails.hooks.http.app)
      .put(`/test/${testModelInDb.id}`)
      .send({
        name : 'newName',
        auth : 'user'
      })
      .expect(200)
      .end((err, res) => {
        res.body.name.should.equal('newName')
        done(err)
      })
    })

    it('should be able to update NON owned model when admin 123', function(done){

      request(s.sails.hooks.http.app)
      .put(`/test/${testModelInDb.id}`)
      .send({
        name : 'newName2',
        auth : 'admin'
      })
      .expect(200)
      .end((err, res) => {
        res.body.name.should.equal('newName2')
        done(err)
      })
    })

    it('should NOT be able to update NON owned model', function(done){

      request(s.sails.hooks.http.app)
      .put(`/test/${testModelInDb.id}`)
      .send({
        name : 'newName2'
      })
      .expect(403)
      .end((err, res) => {
        done(err)
      })
    })
  })
})
