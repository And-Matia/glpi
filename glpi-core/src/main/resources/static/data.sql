-- Languages
INSERT INTO language (name)
VALUES ('English'),
       ('Malagasy');

-- TicketStatus
INSERT INTO ticket_status (color)
VALUES ('#FFFFFF'),
       ('#FFFFFF'),
       ('#FFFFFF'),
       ('#FFFFFF'),
       ('#FFFFFF'),
       ('#FFFFFF');

-- TicketStatusName (English=1, Malagasy=2)
INSERT INTO ticket_status_name (name, language_id, status_id)
VALUES ('New', 1, 1),
       ('Vaovao', 2, 1),
       ('Processing (assigned)', 1, 2),
       ('Ampiasaina', 2, 2),
       ('Processing (planned)', 1, 3),
       ('Voakasa', 2, 3),
       ('Pending', 1, 4),
       ('Miandry', 2, 4),
       ('Solved', 1, 5),
       ('Vita', 2, 5),
       ('Closed', 1, 6),
       ('Voarindrina', 2, 6);