
// External modules
import { assert, expect, should }   from 'chai'
import sinon                        from 'sinon'


// Internal modules
import controllersPolicy from '../../src/policies/controllersPolicy'
import roles             from '../../src/config/defaultRoles'


// Internal config
import * as errorMessages from '../../src/config/errorMessages'



// --------------------------
// ---------- DENY ----------
// --------------------------


describe('controllersPolicy :: Deny', function(){

  it("should deny access when '*' policy is set to false and no controller specific config was found", function(){

    const req  = {options : {controller : 'test'}}
    const config = {
      all : false
    }

    expect(() => controllersPolicy(req, config)).to.throw(errorMessages.controllerNotFound)
  })

  it("should deny access when '*' policy is set to true but controller policy is set to false", function(){

    const req  = {options : {controller : 'test'}}
    const config = {
      all : true,
      test : false
    }

    expect(() => controllersPolicy(req, config)).to.throw(errorMessages.controllerNotAllowed)
  })


  it("should deny when asking a guest controller and logged as a user (with role)", function(){

    const req  = {options : {controller : 'test'}, user : {role : 'user'}}
    const config = {
      all : true,
      test : 'guest'
    }

    expect(() => controllersPolicy(req, config)).to.throw(errorMessages.controllerNotAllowed)
  })

  it("should deny when asking a guest controller and logged as a user (without role)", function(){

    const req  = {options : {controller : 'test'}, user : {name : 'libre'}}
    const config = {
      all : true,
      test : 'guest'
    }

    expect(() => controllersPolicy(req, config)).to.throw(errorMessages.controllerNotAllowed)
  })

  it("should deny when asking a role above req.role", function(){

    const req  = {options : {controller : 'test'}, user : {role : 'user'}}
    const config = {
      roles,
      all : true,
      test : 'admin'
    }

    expect(() => controllersPolicy(req, config)).to.throw(errorMessages.controllerNotAllowed)
  })
})


// --------------------------
// -------- PENDING ---------
// --------------------------


describe('controllersPolicy :: Pending', function(){

  it("should skip to next policy (aka return false)", function(){

    const req  = {options : {controller : 'test'}}
    const config = {
      all : false,
      test : {}
    }

    expect(controllersPolicy(req, config)).to.be.false
  })
})


// --------------------------
// --------- ALLOW ----------
// --------------------------


describe('controllersPolicy :: Allow', function(){

  it("should allow access when wildcard is set to true", function(){

    const req  = {options : {controller : 'test'}}
    const config = {
      all : true,
    }

    expect(controllersPolicy(req, config)).to.be.true
  })

  it("should allow access when controller is set to true", function(){

    const req  = {options : {controller : 'test'}}
    const config = {
      all : false,
      test : true
    }

    expect(controllersPolicy(req, config)).to.be.true
  })

  it("should allow access to guest when controller is set to guest", function(){

    const req  = {options : {controller : 'test'}}
    const config = {
      all : false,
      test : 'guest'
    }

    expect(controllersPolicy(req, config)).to.be.true
  })

  it("should allow access to req when controller is set to lower role", function(){

    const req  = {options : {controller : 'test'}, user : {role : 'admin'}}
    const config = {
      roles,
      all : false,
      test : 'user'
    }

    expect(controllersPolicy(req, config)).to.be.true
  })
})