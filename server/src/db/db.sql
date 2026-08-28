create database if not exists short_link_db;

CREATE Table if not exists short_link_db.short_link_table(
    id int(11) NOT NULL AUTO_INCREMENT,
    short_link varchar(255) NOT NULL,
    long_link varchar(255) NOT NULL,
    created_at datetime NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;