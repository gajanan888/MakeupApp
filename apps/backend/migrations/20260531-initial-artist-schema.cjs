/**
 * Initial migration to create Artists and normalized artist tables
 */

"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Artists
    await queryInterface.createTable("Artists", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        unique: true,
      },
      phone: {
        type: Sequelize.STRING,
      },
      password: {
        type: Sequelize.STRING,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // ArtistProfiles
    await queryInterface.createTable("ArtistProfiles", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      artistId: { type: Sequelize.INTEGER, allowNull: false },
      profileImage: { type: Sequelize.STRING },
      gender: { type: Sequelize.STRING },
      bio: { type: Sequelize.TEXT },
      location: { type: Sequelize.TEXT },
      experience: { type: Sequelize.STRING },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });

    await queryInterface.addConstraint("ArtistProfiles", {
      fields: ["artistId"],
      type: "foreign key",
      name: "fk_artistprofiles_artist",
      references: { table: "Artists", field: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    // ArtistSpecializations
    await queryInterface.createTable("ArtistSpecializations", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      artistId: { type: Sequelize.INTEGER, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });

    await queryInterface.addConstraint("ArtistSpecializations", {
      fields: ["artistId"],
      type: "foreign key",
      name: "fk_artistspecializations_artist",
      references: { table: "Artists", field: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    // ArtistCertificates
    await queryInterface.createTable("ArtistCertificates", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      artistId: { type: Sequelize.INTEGER, allowNull: false },
      fileName: { type: Sequelize.STRING },
      fileUrl: { type: Sequelize.STRING },
      fileSize: { type: Sequelize.INTEGER },
      fileType: { type: Sequelize.STRING },
      certificateNumber: { type: Sequelize.STRING },
      instituteName: { type: Sequelize.STRING },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });

    await queryInterface.addConstraint("ArtistCertificates", {
      fields: ["artistId"],
      type: "foreign key",
      name: "fk_artistcertificates_artist",
      references: { table: "Artists", field: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    // ArtistServices
    await queryInterface.createTable("ArtistServices", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      artistId: { type: Sequelize.INTEGER, allowNull: false },
      specialization: { type: Sequelize.STRING },
      duration: { type: Sequelize.STRING },
      timeRange: { type: Sequelize.STRING },
      priceRange: { type: Sequelize.STRING },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });

    await queryInterface.addConstraint("ArtistServices", {
      fields: ["artistId"],
      type: "foreign key",
      name: "fk_artistservices_artist",
      references: { table: "Artists", field: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    // ArtistPortfolios
    await queryInterface.createTable("ArtistPortfolios", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      artistId: { type: Sequelize.INTEGER, allowNull: false },
      beforeImageUrl: { type: Sequelize.STRING },
      afterImageUrl: { type: Sequelize.STRING },
      tag: { type: Sequelize.STRING },
      description: { type: Sequelize.TEXT },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });

    await queryInterface.addConstraint("ArtistPortfolios", {
      fields: ["artistId"],
      type: "foreign key",
      name: "fk_artistportfolios_artist",
      references: { table: "Artists", field: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    // ArtistPayments
    await queryInterface.createTable("ArtistPayments", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      artistId: { type: Sequelize.INTEGER, allowNull: false, unique: true },
      accountHolder: { type: Sequelize.STRING },
      bankName: { type: Sequelize.STRING },
      accountNumber: { type: Sequelize.STRING },
      ifscCode: { type: Sequelize.STRING },
      upiId: { type: Sequelize.STRING },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });

    await queryInterface.addConstraint("ArtistPayments", {
      fields: ["artistId"],
      type: "foreign key",
      name: "fk_artistpayments_artist",
      references: { table: "Artists", field: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    // Indexes
    await queryInterface.addIndex("Artists", ["email"]);
    await queryInterface.addIndex("ArtistSpecializations", ["artistId"]);
    await queryInterface.addIndex("ArtistServices", ["artistId"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("ArtistPayments");
    await queryInterface.dropTable("ArtistPortfolios");
    await queryInterface.dropTable("ArtistServices");
    await queryInterface.dropTable("ArtistCertificates");
    await queryInterface.dropTable("ArtistSpecializations");
    await queryInterface.dropTable("ArtistProfiles");
    await queryInterface.dropTable("Artists");
  },
};
