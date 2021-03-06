
import permissionPolicies from './policies'
import defaultRoles       from './config/defaultRoles'


module.exports = function (sails) {
  return {

    configure: function(){
      if(!sails.config.permissions) sails.config.permissions = {}
      if(!sails.config.permissions.roles) sails.config.permissions.roles = defaultRoles
      if(!sails.config.permissions.removeAutoAttributes) sails.config.permissions.removeAutoAttributes = true

      // Remove "guest" role from roles if it has been added by user
      sails.config.permissions.roles = sails.config.permissions.roles.filter(role => role !== 'guest')
    },


    // Initialize the hook
    initialize: function (next) {
      const policies = sails.config.policies

      // Flavour sails policies with additional permissionsPolicies
      sails.config.policies = _.each(policies, this.addHookPolicies)

      // If no wildcard is set in config.permissions
      const wildcard = sails.config.permissions['*']
      const wildcardAlias = sails.config.permissions.all

      // Used in case of policy wildcard is a function instead of a boolean
      // Default is false
      if(wildcard === undefined && wildcardAlias === undefined){
        sails.config.permissions['*'] = false
        sails.config.permissions.all  = false

      }else if(wildcard === undefined && wildcardAlias !== undefined){
        sails.config.permissions['*'] = sails.config.permissions.all

      }else if(wildcard !== undefined && wildcardAlias === undefined){
        sails.config.permissions.all = sails.config.permissions['*']
      }

      sails.log.verbose('sails-role-permissions hook initialized')
      next()
    },


    // Function to manipulate sails policies and add permissionsPolicies
    addHookPolicies: function(value, key, collection){

      // Store at permissions config level the value of default policy if value is true or false
      if(key === '*' && (typeof value === 'boolean')){
        sails.config.permissions['*'] = value
        sails.config.permissions.all = value // Alias
        collection[key] = [permissionPolicies]
      }

      if(typeof value === 'string'){
        collection[key] = [value, permissionPolicies]

      }else if(value instanceof Array){
        // Rebuild the policy with previous policies plus additional policies
        collection[key] = [
          ...value,
          permissionPolicies
        ]

      }else if(value instanceof Object){
        collection[key] = _.each(value, this.addHookPolicies)
      }
    },
  };
};
