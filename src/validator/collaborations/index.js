const InvariantError = require('../../exceptions/InvariantError');
const { CollaborationsSchemaPayload } = require('./schema');

const CollaborationsValidator = {
  validateCollaborationPayload: (payload) => {
    const verificationResult = CollaborationsSchemaPayload.validate(payload);
    if (verificationResult.error) {
      throw new InvariantError(verificationResult.error.message);
    }
  },
};

module.exports = CollaborationsValidator;
