-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL,ALLOW_INVALID_DATES';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema newage_sales
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS `newage_sales` ;

-- -----------------------------------------------------
-- Schema newage_sales
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `newage_sales` DEFAULT CHARACTER SET utf8 ;
USE `newage_sales` ;

-- -----------------------------------------------------
-- Table `newage_sales`.`article`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`article` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`article` (
  `article_id` INT(11) NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `text` TEXT NOT NULL,
  `photo` VARCHAR(255) NULL DEFAULT NULL,
  `enabled` TINYINT(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`article_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 8
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`attachment`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`attachment` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`attachment` (
  `attachment_id` INT(11) NOT NULL AUTO_INCREMENT,
  `original_name` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`attachment_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 1226
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`category`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`category` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`category` (
  `category_id` INT(11) NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `order` INT(11) NOT NULL,
  `weight_print` INT(11) NOT NULL,
  PRIMARY KEY (`category_id`),
  UNIQUE INDEX `category_id` (`category_id` ASC))
ENGINE = InnoDB
AUTO_INCREMENT = 11
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`costing_option`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`costing_option` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`costing_option` (
  `costing_option_id` INT NOT NULL,
  `key` VARCHAR(255) NOT NULL,
  `cost` DECIMAL(10,0) NOT NULL,
  PRIMARY KEY (`costing_option_id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`dealership`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`dealership` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`dealership` (
  `dealership_id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(255) NOT NULL,
  `address` VARCHAR(255) NOT NULL,
  `discount_percentage` DECIMAL(10,2) NOT NULL,
  `bank` VARCHAR(32) NOT NULL,
  `bank_bsb` VARCHAR(16) NOT NULL,
  `bank_account` VARCHAR(16) NOT NULL,
  PRIMARY KEY (`dealership_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 13
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`delivery_week`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`delivery_week` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`delivery_week` (
  `delivery_week_id` INT(11) NOT NULL AUTO_INCREMENT,
  `date` DATETIME NOT NULL,
  `limit` INT(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`delivery_week_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 20
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`user_level`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`user_level` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`user_level` (
  `user_level_id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`user_level_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `newage_sales`.`user`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`user` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`user` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `full_name` VARCHAR(255) CHARACTER SET 'utf8' COLLATE 'utf8_unicode_ci' NOT NULL,
  `username` VARCHAR(65) CHARACTER SET 'utf8' COLLATE 'utf8_unicode_ci' NOT NULL DEFAULT '',
  `password` VARCHAR(65) CHARACTER SET 'utf8' COLLATE 'utf8_unicode_ci' NOT NULL DEFAULT '',
  `password_expiry` DATETIME NOT NULL,
  `user_level_id` INT NOT NULL,
  `dealership_id` INT(11) NULL,
  `email` VARCHAR(65) CHARACTER SET 'utf8' COLLATE 'utf8_unicode_ci' NULL DEFAULT NULL,
  `twitter` VARCHAR(128) CHARACTER SET 'utf8' COLLATE 'utf8_unicode_ci' NULL DEFAULT NULL,
  `dealer_name` VARCHAR(255) CHARACTER SET 'utf8' COLLATE 'utf8_unicode_ci' NULL DEFAULT NULL,
  `is_draft_person` TINYINT(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `username` (`username` ASC),
  INDEX `fk_user_dealership1_idx` (`dealership_id` ASC),
  INDEX `fk_user_user_level1_idx` (`user_level_id` ASC),
  CONSTRAINT `fk_user_dealership1`
    FOREIGN KEY (`dealership_id`)
    REFERENCES `newage_sales`.`dealership` (`dealership_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_user_user_level1`
    FOREIGN KEY (`user_level_id`)
    REFERENCES `newage_sales`.`user_level` (`user_level_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 66
DEFAULT CHARACTER SET = utf8
COLLATE = utf8_unicode_ci;


-- -----------------------------------------------------
-- Table `newage_sales`.`state`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`state` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`state` (
  `state_id` INT NOT NULL AUTO_INCREMENT,
  `state` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`state_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `newage_sales`.`owner`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`owner` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`owner` (
  `owner_id` INT(11) NOT NULL AUTO_INCREMENT,
  `first_name` VARCHAR(255) NOT NULL,
  `last_name` VARCHAR(255) NOT NULL,
  `partners_name` VARCHAR(255) NULL,
  `registered_owner` VARCHAR(255) NULL,
  `homephone_number` VARCHAR(255) NULL,
  `mobile_number` VARCHAR(255) NULL,
  `email` VARCHAR(255) NULL,
  `postal_street` VARCHAR(255) NULL,
  `postal_city` VARCHAR(255) NULL,
  `state_id` INT(11) NULL,
  `postal_code` VARCHAR(255) NULL,
  `alternative_address` TEXT NULL,
  `desired_delivery_date` DATE NULL,
  `dealer_id` INT(11) NULL,
  `is_lead` INT(11) NULL DEFAULT '0',
  `delivery_location` VARCHAR(255) NULL,
  `delivery_name` VARCHAR(255) NULL,
  `delivery_address_1` VARCHAR(255) NULL,
  `delivery_address_2` VARCHAR(255) NULL,
  `delivery_telephone` VARCHAR(255) NULL,
  `is_stock` TINYINT(1) NULL DEFAULT '0',
  `user_id` INT(11) NULL DEFAULT '0',
  `have_updated` TINYINT(1) NULL DEFAULT '0',
  `invoice_title` VARCHAR(255) NULL,
  `invoice_address` TEXT NULL,
  `invoice_phone` VARCHAR(20) NULL,
  `invoice_fax` VARCHAR(20) NULL,
  PRIMARY KEY (`owner_id`),
  UNIQUE INDEX `owner_id` (`owner_id` ASC),
  INDEX `fk_owners_users1_idx` (`user_id` ASC),
  INDEX `fk_owners_dealerships1_idx` (`dealer_id` ASC),
  INDEX `fk_owner_state1_idx` (`state_id` ASC),
  CONSTRAINT `fk_owners_users1`
    FOREIGN KEY (`user_id`)
    REFERENCES `newage_sales`.`user` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_owners_dealerships1`
    FOREIGN KEY (`dealer_id`)
    REFERENCES `newage_sales`.`dealership` (`dealership_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_owner_state1`
    FOREIGN KEY (`state_id`)
    REFERENCES `newage_sales`.`state` (`state_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 210
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`model`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`model` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`model` (
  `model_id` INT(11) NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `photo` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`model_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 21
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`series`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`series` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`series` (
  `series_id` INT(11) NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) CHARACTER SET 'utf8' NULL DEFAULT NULL,
  `description` MEDIUMTEXT CHARACTER SET 'utf8' NULL DEFAULT NULL,
  `model_id` INT(11) NOT NULL DEFAULT '0',
  `size` VARCHAR(255) CHARACTER SET 'utf8' NULL DEFAULT NULL,
  `series_weight` VARCHAR(255) CHARACTER SET 'utf8' NULL DEFAULT NULL,
  `internal_cost` INT(11) NOT NULL,
  `whole_sale_cost` DECIMAL(9,2) NOT NULL DEFAULT '0.00',
  `rrp` DECIMAL(9,2) NOT NULL DEFAULT '0.00',
  `plans_id` INT(11) NOT NULL DEFAULT '0',
  `sort_order` INT(11) NOT NULL DEFAULT '0',
  `brochure` VARCHAR(255) NOT NULL,
  `short_title` VARCHAR(20) NOT NULL,
  `customer_plan` VARCHAR(255) NOT NULL,
  `is_suspended` TINYINT(1) NOT NULL DEFAULT '0',
  `url_internal` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`series_id`),
  INDEX `model_id` (`model_id` ASC),
  INDEX `plans_id` (`plans_id` ASC),
  CONSTRAINT `fk_series_models1`
    FOREIGN KEY (`model_id`)
    REFERENCES `newage_sales`.`model` (`model_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 80
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`order_type`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`order_type` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`order_type` (
  `order_type_id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`order_type_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `newage_sales`.`order`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`order` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`order` (
  `order_id` INT(11) NOT NULL AUTO_INCREMENT,
  `parent_order_id` INT(11) NULL DEFAULT NULL,
  `caravan_model` VARCHAR(255) NULL,
  `model_id` INT(11) NULL,
  `model_series` VARCHAR(255) NULL,
  `series_id` INT(11) NULL,
  `series_internal_price` INT(11) NULL,
  `series_wholesale_price` DECIMAL(10,2) NULL,
  `series_retail_price` DECIMAL(10,2) NULL,
  `type_of_finish` VARCHAR(255) NULL,
  `size` VARCHAR(255) NULL,
  `suspension` VARCHAR(255) NULL,
  `tyres` VARCHAR(255) NULL,
  `rims` VARCHAR(255) NULL,
  `max_weight` VARCHAR(255) NULL,
  `tare_weight` VARCHAR(255) NULL DEFAULT NULL,
  `ball_weight` VARCHAR(255) NULL DEFAULT NULL,
  `caravan_year` INT(11) NULL,
  `order_chassis` VARCHAR(16) NULL,
  `order_vin` VARCHAR(26) NULL,
  `delivered_by` VARCHAR(26) NULL,
  `owner_id` INT(11) NULL,
  `user_id` INT(11) NULL,
  `order_total` DECIMAL(10,2) NULL,
  `order_wholesale_total` DECIMAL(10,2) NULL,
  `order_discount` DECIMAL(10,2) NULL,
  `special_notes` TEXT NULL,
  `special_notes_cost` DECIMAL(10,2) NULL,
  `special_note_wholesale_cost` DECIMAL(10,2) NULL,
  `unusual_request` TEXT NULL,
  `status` VARCHAR(255) NULL,
  `vendor_delivery_date` INT(11) NULL,
  `flexible` TINYINT(1) NULL DEFAULT '1',
  `customer_desired_delivery_date` DATETIME NULL,
  `customer_details_cap` TINYINT(1) NULL DEFAULT '0',
  `caravan_details_cap` TINYINT(1) NULL DEFAULT '0',
  `caravan_number_app` TINYINT(1) NULL DEFAULT '0',
  `chassis_number_appointed` TINYINT(1) NULL DEFAULT '0',
  `plans_produced` TINYINT(1) NULL DEFAULT '0',
  `delivery_date_set` TINYINT(1) NULL DEFAULT '0',
  `caravan_build_finish` TINYINT(1) NULL DEFAULT '0',
  `pelmet_fabric_brand` VARCHAR(123) NULL,
  `pelmet_fabric_name` VARCHAR(123) NULL,
  `base_fabric_brand` VARCHAR(123) NULL,
  `base_fabric_name` VARCHAR(123) NULL,
  `back_fabric_brand` VARCHAR(123) NULL,
  `back_fabric_name` VARCHAR(123) NULL,
  `curtain_fabric_brand` VARCHAR(123) NULL,
  `curtain_fabric_name` VARCHAR(123) NULL,
  `stripe` VARCHAR(123) NULL,
  `pebble_guard` VARCHAR(123) NULL,
  `outside_moulding` VARCHAR(123) NULL,
  `lead_id` INT(11) NULL,
  `ge_release_no` VARCHAR(255) NULL,
  `floor_plan_no` VARCHAR(255) NULL,
  `order_retail_adjustment` INT(11) NULL,
  `order_wholesale_adjustment` INT(11) NULL,
  `vendor_original_delivery_date` TIMESTAMP NULL DEFAULT NULL,
  `order_type_id` INT NULL,
  `pickup_date` DATETIME NULL,
  `warranty_date` DATETIME NULL,
  `order_number` VARCHAR(3) NULL,
  `draft_person` INT(11) NULL,
  `order_chassis_price` INT(11) NULL,
  `order_upholstery_price` INT(11) NULL,
  PRIMARY KEY (`order_id`),
  INDEX `fk_orders_users1_idx` (`user_id` ASC),
  INDEX `fk_orders_owners1_idx` (`owner_id` ASC),
  INDEX `fk_orders_series1_idx` (`series_id` ASC),
  INDEX `fk_orders_models1_idx` (`model_id` ASC),
  INDEX `fk_order_order_type1_idx` (`order_type_id` ASC),
  CONSTRAINT `fk_orders_users1`
    FOREIGN KEY (`user_id`)
    REFERENCES `newage_sales`.`user` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_orders_owners1`
    FOREIGN KEY (`owner_id`)
    REFERENCES `newage_sales`.`owner` (`owner_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_orders_series1`
    FOREIGN KEY (`series_id`)
    REFERENCES `newage_sales`.`series` (`series_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_orders_models1`
    FOREIGN KEY (`model_id`)
    REFERENCES `newage_sales`.`model` (`model_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_order_order_type1`
    FOREIGN KEY (`order_type_id`)
    REFERENCES `newage_sales`.`order_type` (`order_type_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 307
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`delivery_dealership`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`delivery_dealership` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`delivery_dealership` (
  `delivery_dealership_id` INT(11) NOT NULL AUTO_INCREMENT,
  `delivery_week_id` INT(11) NOT NULL,
  `dealership_id` INT(11) NOT NULL,
  `date` DATETIME NOT NULL,
  `order_id` INT(11) NOT NULL DEFAULT '0',
  `over_allocation` TINYINT(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`delivery_dealership_id`),
  INDEX `fk_delivery_dealerships_delivery_weeks1_idx` (`delivery_week_id` ASC),
  INDEX `fk_delivery_dealerships_dealerships1_idx` (`dealership_id` ASC),
  INDEX `fk_delivery_dealerships_orders1_idx` (`order_id` ASC),
  CONSTRAINT `fk_delivery_dealerships_delivery_weeks1`
    FOREIGN KEY (`delivery_week_id`)
    REFERENCES `newage_sales`.`delivery_week` (`delivery_week_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_delivery_dealerships_dealerships1`
    FOREIGN KEY (`dealership_id`)
    REFERENCES `newage_sales`.`dealership` (`dealership_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_delivery_dealerships_orders1`
    FOREIGN KEY (`order_id`)
    REFERENCES `newage_sales`.`order` (`order_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 210
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`subcategory`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`subcategory` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`subcategory` (
  `subcategory_id` INT(11) NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `category_id` INT(11) NOT NULL,
  PRIMARY KEY (`subcategory_id`),
  INDEX `fk_subcategories_categories1_idx` (`category_id` ASC),
  CONSTRAINT `fk_subcategories_categories1`
    FOREIGN KEY (`category_id`)
    REFERENCES `newage_sales`.`category` (`category_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 8
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`category_item`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`category_item` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`category_item` (
  `category_item_id` INT(11) NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) CHARACTER SET 'utf8' NULL DEFAULT NULL,
  `description` MEDIUMTEXT CHARACTER SET 'utf8' NULL DEFAULT NULL,
  `sort_order` INT(11) NOT NULL DEFAULT '0',
  `group_id` INT(11) NOT NULL DEFAULT '0',
  `category_id` INT(11) NOT NULL,
  `subcategory_id` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`category_item_id`),
  INDEX `group_id` (`group_id` ASC),
  INDEX `fk_departments_categories1_idx` (`category_id` ASC),
  INDEX `fk_departments_subcategories1_idx` (`subcategory_id` ASC),
  CONSTRAINT `fk_departments_categories1`
    FOREIGN KEY (`category_id`)
    REFERENCES `newage_sales`.`category` (`category_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_departments_subcategories1`
    FOREIGN KEY (`subcategory_id`)
    REFERENCES `newage_sales`.`subcategory` (`subcategory_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 386
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`extra_type`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`extra_type` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`extra_type` (
  `extra_type_id` INT NOT NULL AUTO_INCREMENT COMMENT '	',
  `title` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`extra_type_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `newage_sales`.`extra`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`extra` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`extra` (
  `extra_id` INT(11) NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) CHARACTER SET 'utf8' NULL DEFAULT NULL,
  `extra_type_id` INT NULL,
  `material_cost_price` DECIMAL(9,2) NOT NULL DEFAULT '0.00',
  `whole_sale_price` DECIMAL(9,2) NOT NULL DEFAULT '0.00',
  `rrp` DECIMAL(9,2) NOT NULL DEFAULT '0.00',
  `labour_rate` DECIMAL(9,2) NOT NULL DEFAULT '0.00',
  `labour_hours` INT(11) NOT NULL DEFAULT '0',
  `category_item_id` INT(11) NOT NULL DEFAULT '0',
  `is_package` TINYINT(1) UNSIGNED NOT NULL DEFAULT '0',
  PRIMARY KEY (`extra_id`),
  INDEX `department_id` (`category_item_id` ASC),
  INDEX `fk_extra_extra_type1_idx` (`extra_type_id` ASC),
  CONSTRAINT `fk_extras_departments1`
    FOREIGN KEY (`category_item_id`)
    REFERENCES `newage_sales`.`category_item` (`category_item_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_extra_extra_type1`
    FOREIGN KEY (`extra_type_id`)
    REFERENCES `newage_sales`.`extra_type` (`extra_type_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 1602
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`finish_category`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`finish_category` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`finish_category` (
  `finish_category_id` INT(11) NOT NULL AUTO_INCREMENT,
  `ClassName` ENUM('finish_categories') CHARACTER SET 'utf8' NULL DEFAULT 'finish_categories',
  `created` DATETIME NULL DEFAULT NULL,
  `last_edited` DATETIME NULL DEFAULT NULL,
  `title` VARCHAR(255) CHARACTER SET 'utf8' NULL DEFAULT NULL,
  `description` MEDIUMTEXT CHARACTER SET 'utf8' NULL DEFAULT NULL,
  `sort_order` INT(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`finish_category_id`),
  INDEX `ClassName` (`ClassName` ASC))
ENGINE = InnoDB
AUTO_INCREMENT = 13
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`finish`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`finish` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`finish` (
  `finish_id` INT(11) NOT NULL AUTO_INCREMENT,
  `ClassName` ENUM('finishes') CHARACTER SET 'utf8' NULL DEFAULT 'finishes',
  `finish_title` VARCHAR(255) CHARACTER SET 'utf8' NULL DEFAULT NULL,
  `series_id` INT(11) NOT NULL DEFAULT '0',
  `finish_category_id` INT(11) NOT NULL DEFAULT '0',
  `photo_id` INT(11) NOT NULL DEFAULT '0',
  `sort_order` INT(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`finish_id`),
  INDEX `series_id` (`series_id` ASC),
  INDEX `ClassName` (`ClassName` ASC),
  INDEX `finish_category_id` (`finish_category_id` ASC),
  INDEX `photo_id` (`photo_id` ASC),
  CONSTRAINT `fk_finishes_finish_categories1`
    FOREIGN KEY (`finish_category_id`)
    REFERENCES `newage_sales`.`finish_category` (`finish_category_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_finishes_series1`
    FOREIGN KEY (`series_id`)
    REFERENCES `newage_sales`.`series` (`series_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 75
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`finish_rule`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`finish_rule` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`finish_rule` (
  `finishes_rule_name` VARCHAR(100) NOT NULL,
  `category_item_id` INT(11) NOT NULL,
  PRIMARY KEY (`finishes_rule_name`),
  INDEX `fk_finishes_rules_departments1_idx` (`category_item_id` ASC),
  CONSTRAINT `fk_finishes_rules_departments1`
    FOREIGN KEY (`category_item_id`)
    REFERENCES `newage_sales`.`category_item` (`category_item_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`hols_date`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`hols_date` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`hols_date` (
  `hols_id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `date` DATE NOT NULL,
  PRIMARY KEY (`hols_id`),
  UNIQUE INDEX `hols_id` (`hols_id` ASC))
ENGINE = InnoDB
AUTO_INCREMENT = 11
DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `newage_sales`.`item_uom`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`item_uom` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`item_uom` (
  `item_uom_id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`item_uom_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `newage_sales`.`item`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`item` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`item` (
  `item_id` INT(11) NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `code` VARCHAR(20) NOT NULL,
  `note` TEXT NOT NULL,
  `photo` VARCHAR(255) NULL,
  `uom_id` INT NOT NULL,
  `scrap` INT(11) NOT NULL,
  `internal_unit_cost` DECIMAL(10,2) NOT NULL,
  `internal_total_cost` DECIMAL(10,2) NOT NULL,
  `rrp` DECIMAL(10,2) NOT NULL,
  `wholesale_price` DECIMAL(10,2) NOT NULL,
  `category_item_id` INT(11) NOT NULL,
  `deleted` TINYINT(1) NOT NULL DEFAULT '0',
  `quantity` INT(11) NOT NULL,
  PRIMARY KEY (`item_id`),
  INDEX `fk_items_departments1_idx` (`category_item_id` ASC),
  INDEX `fk_item_item_uom1_idx` (`uom_id` ASC),
  CONSTRAINT `fk_items_departments1`
    FOREIGN KEY (`category_item_id`)
    REFERENCES `newage_sales`.`category_item` (`category_item_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_item_item_uom1`
    FOREIGN KEY (`uom_id`)
    REFERENCES `newage_sales`.`item_uom` (`item_uom_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 2721
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`item_price_history`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`item_price_history` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`item_price_history` (
  `item_price_history_id` INT(11) NOT NULL AUTO_INCREMENT,
  `original_price` DOUBLE(10,2) NOT NULL,
  `new_price` DOUBLE(10,2) NOT NULL,
  `item_id` INT(11) NOT NULL,
  PRIMARY KEY (`item_price_history_id`),
  INDEX `fk_item_price_histories_items_idx` (`item_id` ASC),
  CONSTRAINT `fk_item_price_histories_items`
    FOREIGN KEY (`item_id`)
    REFERENCES `newage_sales`.`item` (`item_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 215
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`rule`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`rule` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`rule` (
  `rule_id` INT(11) NOT NULL AUTO_INCREMENT,
  `rule_number` INT(11) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `text` TEXT NULL DEFAULT NULL,
  `item_id` INT(11) NOT NULL,
  `item_chosen_id` INT(11) NOT NULL,
  PRIMARY KEY (`rule_id`),
  INDEX `fk_rules_items1_idx` (`item_id` ASC),
  CONSTRAINT `fk_rules_items1`
    FOREIGN KEY (`item_id`)
    REFERENCES `newage_sales`.`item` (`item_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 256
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`item_rule`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`item_rule` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`item_rule` (
  `item_rule_id` INT(11) NOT NULL AUTO_INCREMENT,
  `rule_id` INT(11) NOT NULL,
  `item_id` INT(11) NOT NULL,
  PRIMARY KEY (`item_rule_id`),
  INDEX `fk_item_rules_items1_idx` (`item_id` ASC),
  INDEX `fk_item_rules_rules1_idx` (`rule_id` ASC),
  CONSTRAINT `fk_item_rules_items1`
    FOREIGN KEY (`item_id`)
    REFERENCES `newage_sales`.`item` (`item_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_item_rules_rules1`
    FOREIGN KEY (`rule_id`)
    REFERENCES `newage_sales`.`rule` (`rule_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 320
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`item_series`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`item_series` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`item_series` (
  `item_series_id` INT(11) NOT NULL AUTO_INCREMENT,
  `extra` TINYINT(1) NOT NULL DEFAULT '0',
  `visible` TINYINT(1) NOT NULL DEFAULT '1',
  `series_id` INT(11) NOT NULL,
  `item_id` INT(11) NOT NULL,
  `status` VARCHAR(32) NOT NULL,
  PRIMARY KEY (`item_series_id`),
  UNIQUE INDEX `id` (`item_series_id` ASC),
  INDEX `fk_item_series_items1_idx` (`item_id` ASC),
  INDEX `fk_item_series_series1_idx` (`series_id` ASC),
  CONSTRAINT `fk_item_series_items1`
    FOREIGN KEY (`item_id`)
    REFERENCES `newage_sales`.`item` (`item_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_item_series_series1`
    FOREIGN KEY (`series_id`)
    REFERENCES `newage_sales`.`series` (`series_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 48554
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`lead_status`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`lead_status` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`lead_status` (
  `status_id` INT(11) NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`status_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 16
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`lead_first_heard`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`lead_first_heard` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`lead_first_heard` (
  `lead_first_heard_id` INT(11) NOT NULL AUTO_INCREMENT,
  `first_heard` VARCHAR(255) NOT NULL,
  `cost_per_week` DOUBLE(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`lead_first_heard_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 28
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`lead_source`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`lead_source` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`lead_source` (
  `lead_source_id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`lead_source_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `newage_sales`.`lead`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`lead` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`lead` (
  `lead_id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `notes` TEXT NOT NULL,
  `phone` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `state_id` INT NOT NULL,
  `sales_user` INT(11) NOT NULL,
  `lead_status_id` INT(11) NOT NULL DEFAULT '0',
  `lead_source_id` INT NOT NULL,
  `lead_first_heard_id` INT NULL,
  `model_id` INT NOT NULL,
  `reminder_date` DATETIME NOT NULL,
  `created` DATETIME NULL,
  PRIMARY KEY (`lead_id`),
  UNIQUE INDEX `lead_id` (`lead_id` ASC),
  INDEX `fk_leads_leads_status1_idx` (`lead_status_id` ASC),
  INDEX `fk_lead_state1_idx` (`state_id` ASC),
  INDEX `fk_lead_lead_first_heard1_idx` (`lead_first_heard_id` ASC),
  INDEX `fk_lead_lead_source1_idx` (`lead_source_id` ASC),
  INDEX `fk_lead_model1_idx` (`model_id` ASC),
  INDEX `fk_lead_user1_idx` (`sales_user` ASC),
  CONSTRAINT `fk_leads_leads_status1`
    FOREIGN KEY (`lead_status_id`)
    REFERENCES `newage_sales`.`lead_status` (`status_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_lead_state1`
    FOREIGN KEY (`state_id`)
    REFERENCES `newage_sales`.`state` (`state_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_lead_lead_first_heard1`
    FOREIGN KEY (`lead_first_heard_id`)
    REFERENCES `newage_sales`.`lead_first_heard` (`lead_first_heard_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_lead_lead_source1`
    FOREIGN KEY (`lead_source_id`)
    REFERENCES `newage_sales`.`lead_source` (`lead_source_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_lead_model1`
    FOREIGN KEY (`model_id`)
    REFERENCES `newage_sales`.`model` (`model_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_lead_user1`
    FOREIGN KEY (`sales_user`)
    REFERENCES `newage_sales`.`user` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 2165
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`option`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`option` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`option` (
  `option_id` INT NOT NULL AUTO_INCREMENT,
  `key` VARCHAR(255) CHARACTER SET 'utf8' COLLATE 'utf8_unicode_ci' NOT NULL,
  `value` VARCHAR(1024) CHARACTER SET 'utf8' COLLATE 'utf8_unicode_ci' NOT NULL,
  PRIMARY KEY (`option_id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8
COLLATE = utf8_unicode_ci;


-- -----------------------------------------------------
-- Table `newage_sales`.`order_comment`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`order_comment` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`order_comment` (
  `comment_id` INT(11) NOT NULL AUTO_INCREMENT,
  `order_id` INT(11) NOT NULL,
  `user_id` INT(11) NOT NULL,
  `comment_date` DATETIME NOT NULL,
  `comment` LONGTEXT NOT NULL,
  `attachment_id` INT(11) NOT NULL,
  PRIMARY KEY (`comment_id`),
  INDEX `fk_order_comments_orders1_idx` (`order_id` ASC),
  INDEX `fk_order_comments_users1_idx` (`user_id` ASC),
  INDEX `fk_order_comments_attachments1_idx` (`attachment_id` ASC),
  CONSTRAINT `fk_order_comments_orders1`
    FOREIGN KEY (`order_id`)
    REFERENCES `newage_sales`.`order` (`order_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_order_comments_users1`
    FOREIGN KEY (`user_id`)
    REFERENCES `newage_sales`.`user` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_order_comments_attachments1`
    FOREIGN KEY (`attachment_id`)
    REFERENCES `newage_sales`.`attachment` (`attachment_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`order_costing`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`order_costing` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`order_costing` (
  `order_costing_id` INT(11) NOT NULL AUTO_INCREMENT,
  `order_id` INT(11) NOT NULL,
  `freight_cost` DECIMAL(10,2) NOT NULL DEFAULT '0.00',
  `load_warranty_cost` DECIMAL(10,2) NOT NULL DEFAULT '0.00',
  `registration_cost` DECIMAL(10,2) NOT NULL DEFAULT '0.00',
  `spare_wheel_cost` DECIMAL(10,2) NOT NULL DEFAULT '0.00',
  `gas_cost` DECIMAL(10,2) NOT NULL DEFAULT '0.00',
  `pre_inspection_cost` DECIMAL(10,2) NOT NULL DEFAULT '0.00',
  `consumables_cost` DECIMAL(10,2) NOT NULL DEFAULT '0.00',
  `overtrader_cost` DECIMAL(10,2) NOT NULL DEFAULT '0.00',
  `deposit_cost` DECIMAL(10,2) NOT NULL DEFAULT '0.00',
  `pickup_date` DATETIME NOT NULL,
  `trade_in` VARCHAR(255) NULL DEFAULT NULL,
  `commission_cost` DECIMAL(10,2) NOT NULL DEFAULT '0.00',
  `stock_number` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`order_costing_id`),
  INDEX `fk_order_costing_orders1_idx` (`order_id` ASC),
  CONSTRAINT `fk_order_costing_orders1`
    FOREIGN KEY (`order_id`)
    REFERENCES `newage_sales`.`order` (`order_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 13
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`order_extra`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`order_extra` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`order_extra` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `order_id` INT(11) NOT NULL,
  `extra_id` INT(11) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `wholesale_price` DECIMAL(10,2) NOT NULL,
  `retail_price` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_order_extras_orders1_idx` (`order_id` ASC),
  INDEX `fk_order_extras_extras1_idx` (`extra_id` ASC),
  CONSTRAINT `fk_order_extras_orders1`
    FOREIGN KEY (`order_id`)
    REFERENCES `newage_sales`.`order` (`order_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_order_extras_extras1`
    FOREIGN KEY (`extra_id`)
    REFERENCES `newage_sales`.`extra` (`extra_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`order_finish`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`order_finish` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`order_finish` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `order_id` INT(11) NOT NULL,
  `finish_id` INT(11) NOT NULL,
  `finish_name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(255) NOT NULL,
  `hide_order` TINYINT(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  INDEX `fk_order_finishes_orders1_idx` (`order_id` ASC),
  INDEX `fk_order_finishes_finishes1_idx` (`finish_id` ASC),
  CONSTRAINT `fk_order_finishes_orders1`
    FOREIGN KEY (`order_id`)
    REFERENCES `newage_sales`.`order` (`order_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_order_finishes_finishes1`
    FOREIGN KEY (`finish_id`)
    REFERENCES `newage_sales`.`finish` (`finish_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`order_item`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`order_item` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`order_item` (
  `order_item_id` INT(11) NOT NULL AUTO_INCREMENT,
  `item_id` INT(11) NOT NULL,
  `order_id` INT(11) NOT NULL,
  `parent_order_id` INT(11) NULL DEFAULT NULL,
  `internal_cost` INT(11) NOT NULL,
  `rrp` DECIMAL(10,2) NOT NULL,
  `wholesale` DECIMAL(10,2) NOT NULL,
  `category_item_id` INT(11) NOT NULL,
  `is_upgrade` TINYINT(1) NOT NULL DEFAULT '0',
  `hide_order` TINYINT(1) NOT NULL DEFAULT '0',
  `is_mandatory` TINYINT(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`order_item_id`),
  UNIQUE INDEX `order_item_id` (`order_item_id` ASC),
  INDEX `fk_order_items_orders1_idx` (`order_id` ASC),
  INDEX `fk_order_items_items1_idx` (`item_id` ASC),
  CONSTRAINT `fk_order_items_orders1`
    FOREIGN KEY (`order_id`)
    REFERENCES `newage_sales`.`order` (`order_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_order_items_items1`
    FOREIGN KEY (`item_id`)
    REFERENCES `newage_sales`.`item` (`item_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 20147
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`order_special`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`order_special` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`order_special` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `order_id` INT(11) NOT NULL,
  `category_id` INT(11) NOT NULL,
  `category_item_id` INT(11) NULL DEFAULT NULL,
  `notes` TEXT NOT NULL,
  `wholesale_cost` DECIMAL(10,2) NOT NULL,
  `retail_cost` DECIMAL(10,2) NOT NULL,
  `internal_cost` INT(11) NOT NULL,
  `hide_order` TINYINT(1) NOT NULL DEFAULT '0',
  `rule_id` INT(11) NOT NULL,
  `quantity` INT(11) NOT NULL DEFAULT '1',
  `code` VARCHAR(20) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_order_specials_orders1_idx` (`order_id` ASC),
  INDEX `fk_order_specials_categories1_idx` (`category_id` ASC),
  INDEX `fk_order_specials_departments1_idx` (`category_item_id` ASC),
  INDEX `fk_order_specials_rules1_idx` (`rule_id` ASC),
  CONSTRAINT `fk_order_specials_orders1`
    FOREIGN KEY (`order_id`)
    REFERENCES `newage_sales`.`order` (`order_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_order_specials_categories1`
    FOREIGN KEY (`category_id`)
    REFERENCES `newage_sales`.`category` (`category_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_order_specials_departments1`
    FOREIGN KEY (`category_item_id`)
    REFERENCES `newage_sales`.`category_item` (`category_item_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_order_specials_rules1`
    FOREIGN KEY (`rule_id`)
    REFERENCES `newage_sales`.`rule` (`rule_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 2
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`order_standard_feature`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`order_standard_feature` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`order_standard_feature` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `order_id` INT(11) NOT NULL,
  `feature` VARCHAR(255) NOT NULL,
  `hide_order` TINYINT(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  INDEX `fk_order_standard_features_orders1_idx` (`order_id` ASC),
  CONSTRAINT `fk_order_standard_features_orders1`
    FOREIGN KEY (`order_id`)
    REFERENCES `newage_sales`.`order` (`order_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`order_history`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`order_history` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`order_history` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `status` VARCHAR(255) NOT NULL,
  `user` INT(11) NOT NULL,
  `order_id` INT(11) NOT NULL,
  `order_item_id` INT(11) NULL DEFAULT NULL,
  `order_special_id` INT(11) NULL DEFAULT NULL,
  `order_production_id` INT(11) NULL DEFAULT NULL,
  `order_finishes_id` INT(11) NULL DEFAULT NULL,
  `order_standard_features_id` INT(11) NULL DEFAULT NULL,
  `order_wholesale_price` INT(11) NULL DEFAULT NULL,
  `order_retail_price` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_order_histories_orders1_idx` (`order_id` ASC),
  INDEX `fk_order_histories_order_items1_idx` (`order_item_id` ASC),
  INDEX `fk_order_histories_order_specials1_idx` (`order_special_id` ASC),
  INDEX `fk_order_histories_order_finishes1_idx` (`order_finishes_id` ASC),
  INDEX `fk_order_histories_order_standard_features1_idx` (`order_standard_features_id` ASC),
  CONSTRAINT `fk_order_histories_orders1`
    FOREIGN KEY (`order_id`)
    REFERENCES `newage_sales`.`order` (`order_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_order_histories_order_items1`
    FOREIGN KEY (`order_item_id`)
    REFERENCES `newage_sales`.`order_item` (`order_item_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_order_histories_order_specials1`
    FOREIGN KEY (`order_special_id`)
    REFERENCES `newage_sales`.`order_special` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_order_histories_order_finishes1`
    FOREIGN KEY (`order_finishes_id`)
    REFERENCES `newage_sales`.`order_finish` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_order_histories_order_standard_features1`
    FOREIGN KEY (`order_standard_features_id`)
    REFERENCES `newage_sales`.`order_standard_feature` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 691
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`order_issue_history_status`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`order_issue_history_status` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`order_issue_history_status` (
  `order_issue_history_status_id` INT NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`order_issue_history_status_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `newage_sales`.`order_issue_history`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`order_issue_history` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`order_issue_history` (
  `order_issue_history_id` INT(11) NOT NULL AUTO_INCREMENT,
  `order_id` INT(11) NOT NULL,
  `status_id` INT NOT NULL,
  `approval_by` INT(11) NOT NULL,
  PRIMARY KEY (`order_issue_history_id`),
  INDEX `fk_order_issue_histories_orders1_idx` (`order_id` ASC),
  INDEX `fk_order_issue_history_order_issue_history_status1_idx` (`status_id` ASC),
  CONSTRAINT `fk_order_issue_histories_orders1`
    FOREIGN KEY (`order_id`)
    REFERENCES `newage_sales`.`order` (`order_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_order_issue_history_order_issue_history_status1`
    FOREIGN KEY (`status_id`)
    REFERENCES `newage_sales`.`order_issue_history_status` (`order_issue_history_status_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 3
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`order_issue`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`order_issue` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`order_issue` (
  `order_issue_id` INT(11) NOT NULL AUTO_INCREMENT,
  `order_id` INT(11) NOT NULL,
  `text` TEXT NOT NULL,
  `fixed_date` DATETIME NULL,
  `repairer` VARCHAR(255) NULL DEFAULT NULL,
  `price_quote` INT(11) NULL DEFAULT NULL,
  `item_id` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`order_issue_id`),
  INDEX `fk_order_issues_orders1_idx` (`order_id` ASC),
  INDEX `fk_order_issues_items1_idx` (`item_id` ASC),
  CONSTRAINT `fk_order_issues_orders1`
    FOREIGN KEY (`order_id`)
    REFERENCES `newage_sales`.`order` (`order_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_order_issues_items1`
    FOREIGN KEY (`item_id`)
    REFERENCES `newage_sales`.`item` (`item_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 4
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`order_issue_note`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`order_issue_note` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`order_issue_note` (
  `order_issue_note_id` INT(11) NOT NULL AUTO_INCREMENT,
  `order_issue_id` INT(11) NOT NULL,
  `note` TEXT NOT NULL,
  PRIMARY KEY (`order_issue_note_id`),
  INDEX `fk_order_issue_notes_order_issues1_idx` (`order_issue_id` ASC),
  CONSTRAINT `fk_order_issue_notes_order_issues1`
    FOREIGN KEY (`order_issue_id`)
    REFERENCES `newage_sales`.`order_issue` (`order_issue_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 2
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`order_issue_photo`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`order_issue_photo` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`order_issue_photo` (
  `order_issue_photo_id` INT(11) NOT NULL AUTO_INCREMENT,
  `order_issue_id` INT(11) NOT NULL,
  `photo` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`order_issue_photo_id`),
  INDEX `fk_order_issue_photos_order_issues1_idx` (`order_issue_id` ASC),
  CONSTRAINT `fk_order_issue_photos_order_issues1`
    FOREIGN KEY (`order_issue_id`)
    REFERENCES `newage_sales`.`order_issue` (`order_issue_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`order_message`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`order_message` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`order_message` (
  `order_message_id` INT(11) NOT NULL AUTO_INCREMENT,
  `order_id` INT(11) NOT NULL,
  `message` TEXT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`order_message_id`),
  INDEX `fk_order_messages_orders1_idx` (`order_id` ASC),
  CONSTRAINT `fk_order_messages_orders1`
    FOREIGN KEY (`order_id`)
    REFERENCES `newage_sales`.`order` (`order_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 3
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`order_photo`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`order_photo` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`order_photo` (
  `order_photo_id` INT(11) NOT NULL AUTO_INCREMENT,
  `order_id` INT(11) NOT NULL,
  `photo` VARCHAR(255) NOT NULL,
  `hide_customer` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`order_photo_id`),
  INDEX `fk_order_photos_orders1_idx` (`order_id` ASC),
  CONSTRAINT `fk_order_photos_orders1`
    FOREIGN KEY (`order_id`)
    REFERENCES `newage_sales`.`order` (`order_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 5
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`order_production_note`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`order_production_note` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`order_production_note` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `order_id` INT(11) NOT NULL,
  `category_id` INT(11) NOT NULL,
  `production_notes` VARCHAR(255) NOT NULL,
  `hide_order` TINYINT(1) NOT NULL DEFAULT '0',
  `rule_id` INT(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `id` (`id` ASC),
  INDEX `fk_order_production_notes_orders1_idx` (`order_id` ASC),
  INDEX `fk_order_production_notes_categories1_idx` (`category_id` ASC),
  INDEX `fk_order_production_notes_rules1_idx` (`rule_id` ASC),
  CONSTRAINT `fk_order_production_notes_orders1`
    FOREIGN KEY (`order_id`)
    REFERENCES `newage_sales`.`order` (`order_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_order_production_notes_categories1`
    FOREIGN KEY (`category_id`)
    REFERENCES `newage_sales`.`category` (`category_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_order_production_notes_rules1`
    FOREIGN KEY (`rule_id`)
    REFERENCES `newage_sales`.`rule` (`rule_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 7
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`order_rule_plan`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`order_rule_plan` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`order_rule_plan` (
  `order_rule_plan_id` INT(11) NOT NULL AUTO_INCREMENT,
  `order_item_id` INT(11) NOT NULL,
  `rule_id` INT(11) NOT NULL,
  `attachment_id` INT(11) NOT NULL,
  PRIMARY KEY (`order_rule_plan_id`),
  INDEX `fk_order_rule_plans_order_items1_idx` (`order_item_id` ASC),
  INDEX `fk_order_rule_plans_rules1_idx` (`rule_id` ASC),
  INDEX `fk_order_rule_plans_attachments1_idx` (`attachment_id` ASC),
  CONSTRAINT `fk_order_rule_plans_order_items1`
    FOREIGN KEY (`order_item_id`)
    REFERENCES `newage_sales`.`order_item` (`order_item_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_order_rule_plans_rules1`
    FOREIGN KEY (`rule_id`)
    REFERENCES `newage_sales`.`rule` (`rule_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_order_rule_plans_attachments1`
    FOREIGN KEY (`attachment_id`)
    REFERENCES `newage_sales`.`attachment` (`attachment_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`order_status_type`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`order_status_type` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`order_status_type` (
  `order_status_type_id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(45) NULL,
  `step` INT NULL,
  PRIMARY KEY (`order_status_type_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `newage_sales`.`order_status`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`order_status` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`order_status` (
  `order_status_id` INT(11) NOT NULL AUTO_INCREMENT,
  `order_id` INT(11) NOT NULL,
  `user_id` INT(11) NOT NULL,
  `order_status_type_id` INT NOT NULL,
  `date` DATE NOT NULL,
  `comment` VARCHAR(64) NOT NULL,
  `attachment_id` INT(11) NOT NULL,
  PRIMARY KEY (`order_status_id`),
  INDEX `fk_order_status_orders1_idx` (`order_id` ASC),
  INDEX `fk_order_status_users1_idx` (`user_id` ASC),
  INDEX `fk_order_status_status1_idx` (`order_status_type_id` ASC),
  CONSTRAINT `fk_order_status_orders1`
    FOREIGN KEY (`order_id`)
    REFERENCES `newage_sales`.`order` (`order_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_order_status_users1`
    FOREIGN KEY (`user_id`)
    REFERENCES `newage_sales`.`user` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_order_status_status1`
    FOREIGN KEY (`order_status_type_id`)
    REFERENCES `newage_sales`.`order_status_type` (`order_status_type_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 1503
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`order_upgrade_cost`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`order_upgrade_cost` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`order_upgrade_cost` (
  `order_extra_cost_id` INT(11) NOT NULL AUTO_INCREMENT,
  `order_id` INT(11) NOT NULL,
  `order_item_id` INT(11) NOT NULL,
  `decided_by` INT(11) NULL DEFAULT '0',
  `cost` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`order_extra_cost_id`),
  INDEX `fk_order_upgrades_cost_orders1_idx` (`order_id` ASC),
  INDEX `fk_order_upgrades_cost_order_items1_idx` (`order_item_id` ASC),
  CONSTRAINT `fk_order_upgrades_cost_orders1`
    FOREIGN KEY (`order_id`)
    REFERENCES `newage_sales`.`order` (`order_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_order_upgrades_cost_order_items1`
    FOREIGN KEY (`order_item_id`)
    REFERENCES `newage_sales`.`order_item` (`order_item_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 148
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`qa_category`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`qa_category` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`qa_category` (
  `qa_category_id` INT(11) NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `weight` INT(11) NOT NULL,
  PRIMARY KEY (`qa_category_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 18
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`qa_order_locked_status`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`qa_order_locked_status` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`qa_order_locked_status` (
  `qa_order_locked_status_id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(45) NULL,
  PRIMARY KEY (`qa_order_locked_status_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `newage_sales`.`qa_order`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`qa_order` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`qa_order` (
  `order_id` INT(11) NOT NULL,
  `locked_status` INT NOT NULL,
  `assigned` VARCHAR(4) NULL DEFAULT NULL,
  `galvinised` TINYINT(1) NOT NULL DEFAULT '0',
  `coll_type` VARCHAR(10) NULL DEFAULT NULL,
  `floor_vinyl` VARCHAR(255) NULL DEFAULT NULL,
  `bench_tops` VARCHAR(255) NULL DEFAULT NULL,
  `awning` VARCHAR(255) NULL DEFAULT NULL,
  `internal_doors` VARCHAR(255) NULL DEFAULT NULL,
  `external_doors` VARCHAR(255) NULL DEFAULT NULL,
  `fridge_type` VARCHAR(255) NULL DEFAULT NULL,
  `wash_machine` VARCHAR(255) NULL DEFAULT NULL,
  `upholstery` VARCHAR(255) NULL DEFAULT NULL,
  `mattress` VARCHAR(255) NULL DEFAULT NULL,
  `miscellaneous` VARCHAR(255) NULL DEFAULT NULL,
  `notes` VARCHAR(255) NULL DEFAULT NULL,
  PRIMARY KEY (`order_id`),
  INDEX `fk_qa_order_qa_order_locked_status1_idx` (`locked_status` ASC),
  CONSTRAINT `fk_qa_order_qa_order_locked_status1`
    FOREIGN KEY (`locked_status`)
    REFERENCES `newage_sales`.`qa_order_locked_status` (`qa_order_locked_status_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`qa_history`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`qa_history` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`qa_history` (
  `qa_history_id` INT(11) NOT NULL AUTO_INCREMENT,
  `order_id` INT(11) NOT NULL,
  `date` DATE NOT NULL,
  `inspector_id` INT(11) NOT NULL,
  PRIMARY KEY (`qa_history_id`),
  INDEX `fk_qa_histories_qa_orders1_idx` (`order_id` ASC),
  INDEX `fk_qa_histories_users1_idx` (`inspector_id` ASC),
  CONSTRAINT `fk_qa_histories_qa_orders1`
    FOREIGN KEY (`order_id`)
    REFERENCES `newage_sales`.`qa_order` (`order_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_qa_histories_users1`
    FOREIGN KEY (`inspector_id`)
    REFERENCES `newage_sales`.`user` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 218
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`qa_item`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`qa_item` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`qa_item` (
  `qa_item_id` INT(11) NOT NULL AUTO_INCREMENT,
  `qa_category_id` INT(11) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `weight` INT(11) NOT NULL,
  PRIMARY KEY (`qa_item_id`),
  INDEX `fk_qa_items_qa_categories1_idx` (`qa_category_id` ASC),
  CONSTRAINT `fk_qa_items_qa_categories1`
    FOREIGN KEY (`qa_category_id`)
    REFERENCES `newage_sales`.`qa_category` (`qa_category_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 141
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`qa_item_missing_status`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`qa_item_missing_status` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`qa_item_missing_status` (
  `qa_item_missing_status_id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`qa_item_missing_status_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `newage_sales`.`qa_item_missing`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`qa_item_missing` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`qa_item_missing` (
  `qa_item_missing_id` INT(11) NOT NULL AUTO_INCREMENT,
  `order_id` INT(11) NOT NULL,
  `description` TEXT NOT NULL,
  `note` TEXT NOT NULL,
  `status_id` INT NOT NULL,
  `created` DATETIME NOT NULL,
  PRIMARY KEY (`qa_item_missing_id`),
  INDEX `fk_qa_items_missing_qa_orders1_idx` (`order_id` ASC),
  INDEX `fk_qa_item_missing_qa_item_missing_status1_idx` (`status_id` ASC),
  CONSTRAINT `fk_qa_items_missing_qa_orders1`
    FOREIGN KEY (`order_id`)
    REFERENCES `newage_sales`.`qa_order` (`order_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_qa_item_missing_qa_item_missing_status1`
    FOREIGN KEY (`status_id`)
    REFERENCES `newage_sales`.`qa_item_missing_status` (`qa_item_missing_status_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 5
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`qa_order_item_status`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`qa_order_item_status` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`qa_order_item_status` (
  `qa_order_item_status_id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`qa_order_item_status_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `newage_sales`.`qa_order_item`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`qa_order_item` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`qa_order_item` (
  `qa_order_item_id` INT(11) NOT NULL AUTO_INCREMENT,
  `order_id` INT(11) NOT NULL,
  `qa_item_id` INT(11) NOT NULL,
  `status_id` INT NOT NULL,
  PRIMARY KEY (`qa_order_item_id`),
  INDEX `fk_qa_order_items_qa_orders1_idx` (`order_id` ASC),
  INDEX `fk_qa_order_items_qa_items1_idx` (`qa_item_id` ASC),
  INDEX `fk_qa_order_item_qa_order_item_status1_idx` (`status_id` ASC),
  CONSTRAINT `fk_qa_order_items_qa_orders1`
    FOREIGN KEY (`order_id`)
    REFERENCES `newage_sales`.`qa_order` (`order_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_qa_order_items_qa_items1`
    FOREIGN KEY (`qa_item_id`)
    REFERENCES `newage_sales`.`qa_item` (`qa_item_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_qa_order_items_orders1`
    FOREIGN KEY (`order_id`)
    REFERENCES `newage_sales`.`order` (`order_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_qa_order_item_qa_order_item_status1`
    FOREIGN KEY (`status_id`)
    REFERENCES `newage_sales`.`qa_order_item_status` (`qa_order_item_status_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 76567
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`qa_order_item_note`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`qa_order_item_note` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`qa_order_item_note` (
  `qa_order_item_note_id` INT(11) NOT NULL AUTO_INCREMENT,
  `qa_order_item_id` INT(11) NOT NULL,
  `note` TEXT NULL DEFAULT NULL,
  PRIMARY KEY (`qa_order_item_note_id`),
  INDEX `fk_qa_order_item_notes_qa_order_items1_idx` (`qa_order_item_id` ASC),
  CONSTRAINT `fk_qa_order_item_notes_qa_order_items1`
    FOREIGN KEY (`qa_order_item_id`)
    REFERENCES `newage_sales`.`qa_order_item` (`qa_order_item_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`qa_order_item_photo`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`qa_order_item_photo` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`qa_order_item_photo` (
  `qa_order_item_photo_id` INT(11) NOT NULL AUTO_INCREMENT,
  `qa_order_item_id` INT(11) NOT NULL,
  `photo` VARCHAR(255) NOT NULL,
  `hide_customer` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`qa_order_item_photo_id`),
  INDEX `fk_qa_order_item_photos_qa_order_items1_idx` (`qa_order_item_id` ASC),
  CONSTRAINT `fk_qa_order_item_photos_qa_order_items1`
    FOREIGN KEY (`qa_order_item_id`)
    REFERENCES `newage_sales`.`qa_order_item` (`qa_order_item_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`qa_prod_category`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`qa_prod_category` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`qa_prod_category` (
  `qa_prod_category_id` INT(11) NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `weight` INT(11) NOT NULL,
  PRIMARY KEY (`qa_prod_category_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 9
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`qa_prod_history`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`qa_prod_history` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`qa_prod_history` (
  `qa_prod_history_id` INT(11) NOT NULL AUTO_INCREMENT,
  `order_id` INT(11) NOT NULL,
  `date` DATE NOT NULL,
  `inspector_id` INT(11) NOT NULL,
  PRIMARY KEY (`qa_prod_history_id`),
  INDEX `fk_qa_prod_histories_orders1_idx` (`order_id` ASC),
  INDEX `fk_qa_prod_histories_users1_idx` (`inspector_id` ASC),
  CONSTRAINT `fk_qa_prod_histories_orders1`
    FOREIGN KEY (`order_id`)
    REFERENCES `newage_sales`.`order` (`order_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_qa_prod_histories_users1`
    FOREIGN KEY (`inspector_id`)
    REFERENCES `newage_sales`.`user` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 189
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`qa_prod_item`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`qa_prod_item` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`qa_prod_item` (
  `qa_prod_item_id` INT(11) NOT NULL AUTO_INCREMENT,
  `qa_prod_category_id` INT(11) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `weight` INT(11) NOT NULL,
  PRIMARY KEY (`qa_prod_item_id`),
  INDEX `fk_qa_prod_items_qa_prod_categories1_idx` (`qa_prod_category_id` ASC),
  CONSTRAINT `fk_qa_prod_items_qa_prod_categories1`
    FOREIGN KEY (`qa_prod_category_id`)
    REFERENCES `newage_sales`.`qa_prod_category` (`qa_prod_category_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 139
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`qa_prod_order_item`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`qa_prod_order_item` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`qa_prod_order_item` (
  `qa_prod_order_item_id` INT(11) NOT NULL AUTO_INCREMENT,
  `order_id` INT(11) NOT NULL,
  `qa_prod_item_id` INT(11) NOT NULL,
  `status_id` INT NOT NULL,
  PRIMARY KEY (`qa_prod_order_item_id`),
  INDEX `fk_qa_prod_order_items_orders1_idx` (`order_id` ASC),
  INDEX `fk_qa_prod_order_items_qa_prod_items1_idx` (`qa_prod_item_id` ASC),
  INDEX `fk_qa_prod_order_item_qa_order_item_status1_idx` (`status_id` ASC),
  CONSTRAINT `fk_qa_prod_order_items_orders1`
    FOREIGN KEY (`order_id`)
    REFERENCES `newage_sales`.`order` (`order_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_qa_prod_order_items_qa_prod_items1`
    FOREIGN KEY (`qa_prod_item_id`)
    REFERENCES `newage_sales`.`qa_prod_item` (`qa_prod_item_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_qa_prod_order_item_qa_order_item_status1`
    FOREIGN KEY (`status_id`)
    REFERENCES `newage_sales`.`qa_order_item_status` (`qa_order_item_status_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 19039
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`qa_prod_order_item_note`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`qa_prod_order_item_note` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`qa_prod_order_item_note` (
  `qa_prod_order_item_note_id` INT(11) NOT NULL AUTO_INCREMENT,
  `qa_prod_order_item_id` INT(11) NOT NULL,
  `note` TEXT NULL DEFAULT NULL,
  PRIMARY KEY (`qa_prod_order_item_note_id`),
  INDEX `fk_qa_prod_order_item_notes_qa_prod_order_items1_idx` (`qa_prod_order_item_id` ASC),
  CONSTRAINT `fk_qa_prod_order_item_notes_qa_prod_order_items1`
    FOREIGN KEY (`qa_prod_order_item_id`)
    REFERENCES `newage_sales`.`qa_prod_order_item` (`qa_prod_order_item_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 3
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`qa_prod_order_item_photo`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`qa_prod_order_item_photo` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`qa_prod_order_item_photo` (
  `qa_prod_order_item_photo_id` INT(11) NOT NULL AUTO_INCREMENT,
  `qa_prod_order_item_id` INT(11) NOT NULL,
  `photo` VARCHAR(255) NOT NULL,
  `hide_customer` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`qa_prod_order_item_photo_id`),
  INDEX `fk_qa_prod_order_item_photos_qa_prod_order_items1_idx` (`qa_prod_order_item_id` ASC),
  CONSTRAINT `fk_qa_prod_order_item_photos_qa_prod_order_items1`
    FOREIGN KEY (`qa_prod_order_item_id`)
    REFERENCES `newage_sales`.`qa_prod_order_item` (`qa_prod_order_item_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 10
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`series_extra`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`series_extra` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`series_extra` (
  `ID` INT(11) NOT NULL AUTO_INCREMENT,
  `series_id` INT(11) NOT NULL DEFAULT '0',
  `extra_id` INT(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`ID`),
  INDEX `SeriesID` (`series_id` ASC),
  INDEX `ExtrasID` (`extra_id` ASC),
  CONSTRAINT `fk_series_extras_series1`
    FOREIGN KEY (`series_id`)
    REFERENCES `newage_sales`.`series` (`series_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_series_extras_extras1`
    FOREIGN KEY (`extra_id`)
    REFERENCES `newage_sales`.`extra` (`extra_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 55697
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`series_photo`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`series_photo` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`series_photo` (
  `series_photo_id` INT(11) NOT NULL AUTO_INCREMENT,
  `series_id` INT(11) NOT NULL,
  `photo` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`series_photo_id`),
  INDEX `fk_series_photos_series1_idx` (`series_id` ASC),
  CONSTRAINT `fk_series_photos_series1`
    FOREIGN KEY (`series_id`)
    REFERENCES `newage_sales`.`series` (`series_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 12
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`series_price_history`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`series_price_history` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`series_price_history` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `series_id` INT(11) NOT NULL,
  `original_rrp` DECIMAL(10,2) NOT NULL,
  `new_rrp` DECIMAL(10,2) NOT NULL,
  `original_wholesale` DECIMAL(10,2) NOT NULL,
  `new_wholesale` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `id` (`id` ASC),
  INDEX `fk_series_price_histories_series1_idx` (`series_id` ASC),
  CONSTRAINT `fk_series_price_histories_series1`
    FOREIGN KEY (`series_id`)
    REFERENCES `newage_sales`.`series` (`series_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 100
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`series_rule`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`series_rule` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`series_rule` (
  `series_rule_id` INT(11) NOT NULL AUTO_INCREMENT,
  `series_id` INT(11) NOT NULL,
  `rule_id` INT(11) NOT NULL,
  PRIMARY KEY (`series_rule_id`),
  INDEX `fk_series_rules_series1_idx` (`series_id` ASC),
  INDEX `fk_series_rules_rules1_idx` (`rule_id` ASC),
  CONSTRAINT `fk_series_rules_series1`
    FOREIGN KEY (`series_id`)
    REFERENCES `newage_sales`.`series` (`series_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_series_rules_rules1`
    FOREIGN KEY (`rule_id`)
    REFERENCES `newage_sales`.`rule` (`rule_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 9568
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `newage_sales`.`weight`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `newage_sales`.`weight` ;

CREATE TABLE IF NOT EXISTS `newage_sales`.`weight` (
  `weight_id` INT(11) NOT NULL AUTO_INCREMENT,
  `chassis` VARCHAR(255) NOT NULL,
  `model_id` INT(11) NOT NULL,
  `series_id` INT(11) NOT NULL,
  `model_name` VARCHAR(255) NOT NULL,
  `customer` VARCHAR(255) NOT NULL,
  `vin` VARCHAR(255) NOT NULL,
  `atm` VARCHAR(255) NOT NULL,
  `gtm` VARCHAR(255) NOT NULL,
  `tare` VARCHAR(255) NOT NULL,
  `ball` VARCHAR(255) NOT NULL,
  `rim_tyre` VARCHAR(255) NOT NULL,
  `tyre_press` VARCHAR(255) NOT NULL,
  `axel_load` VARCHAR(255) NOT NULL,
  `created` DATETIME NOT NULL,
  `edited` DATETIME NOT NULL,
  PRIMARY KEY (`weight_id`),
  INDEX `fk_weights_series1_idx` (`series_id` ASC),
  INDEX `fk_weights_models1_idx` (`model_id` ASC),
  CONSTRAINT `fk_weights_series1`
    FOREIGN KEY (`series_id`)
    REFERENCES `newage_sales`.`series` (`series_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_weights_models1`
    FOREIGN KEY (`model_id`)
    REFERENCES `newage_sales`.`model` (`model_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 928
DEFAULT CHARACTER SET = latin1;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
