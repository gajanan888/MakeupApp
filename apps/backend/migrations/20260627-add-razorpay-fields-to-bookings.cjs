'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Bookings', 'razorpayOrderId', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    
    // Add index to razorpayOrderId for webhook lookups
    await queryInterface.addIndex('Bookings', ['razorpayOrderId']);

    await queryInterface.addColumn('Bookings', 'razorpayPaymentId', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });

    await queryInterface.addColumn('Bookings', 'paymentStatus', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'unpaid',
    });

    await queryInterface.addColumn('Bookings', 'paymentMethod', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Bookings', 'paidAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('Bookings', 'paymentFailureReason', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Bookings', 'paymentGateway', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'razorpay',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Bookings', 'razorpayOrderId');
    await queryInterface.removeColumn('Bookings', 'razorpayPaymentId');
    await queryInterface.removeColumn('Bookings', 'paymentStatus');
    await queryInterface.removeColumn('Bookings', 'paymentMethod');
    await queryInterface.removeColumn('Bookings', 'paidAt');
    await queryInterface.removeColumn('Bookings', 'paymentFailureReason');
    await queryInterface.removeColumn('Bookings', 'paymentGateway');
  }
};
