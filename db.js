const {Sequelize} = require('sequelize')

module.exports = new Sequelize('postgres://imrlrtibunknmr:ded408b2895da44ee7225de59b15afee289db0d37fbff0788a7ed631d228767c@ec2-99-80-170-190.eu-west-1.compute.amazonaws.com:5432/d71gjgghsnlqtk', {
		dialect: 'postgres',
		protocol: 'postgres',
		dialectOptions: {
			ssl: {
				require: true,
      			rejectUnauthorized: false
			}
		}
	}
)