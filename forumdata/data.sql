CREATE TABLE IF NOT EXISTS cookies (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	userid TEXT NOT NULL,
	cookieId TEXT NOT NULL,
	expires DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
	userid TEXT NOT NULL,
	nickname TEXT NOT NULL,
    age INTEGER,
    gender TEXT NOT NULL,
    firstname TEXT NOT NULL,
    lastname TEXT NOT NULL,
	email TEXT NOT NULL,
	passwd TEXT NOT NULL,
	staatus TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	categoryName TEXT NOT NULL,
	img TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS posts (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	heading TEXT NOT NULL,
	tekst TEXT NOT NULL,
	likecount INTEGER DEFAULT 0,
	dislikecount INTEGER DEFAULT 0,
	commentcount INTEGER DEFAULT 0,
	category TEXT NOT NULL,
	userid TEXT
);

CREATE TABLE IF NOT EXISTS comments (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	post_id INTEGER,
	comment TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
	dislikes INTEGER DEFAULT 0,
	commentUserId TEXT
);

CREATE TABLE IF NOT EXISTS likes (
	userId TEXT NOT NULL,
	postId INTEGER NOT NULL,
	postType TEXT NOT NULL,
	likeType TEXT NOT NULL,
	commentId INTEGER
);

CREATE TABLE IF NOT EXISTS chats (
	toUser TEXT NOT NULL,
	fromUser TEXT NOT NULL,
	timeSent TEXT NOT NULL,
	msg TEXT NOT NULL
);

INSERT INTO categories (id, categoryName, img) VALUES 
(1, "Info", "./static/img/Information.png");

INSERT INTO categories (id, categoryName, img) VALUES 
(2, "School", "./static/img/School.png");

INSERT INTO categories (id, categoryName, img) VALUES 
(3, "Creativity", "./static/img/Creativity.png");


INSERT INTO posts (heading, tekst, likecount, dislikecount, commentcount, category, userid) VALUES 
('Discover the Power of Meditation', 'Meditation is a simple and effective practice that has 
been used for centuries to promote mental and physical well-being. It involves focusing your 
mind on a particular object, sound, or phrase to calm your thoughts and improve your overall 
mental state. Research has shown that meditation can have a positive impact on stress, anxiety, 
and depression, as well as improve focus, memory, and overall well-being.', 5, 2, 0, 'Info', "1"), 
('The Art of Creative Writing', 'Creative writing is a form of self-expression that allows you 
to explore your imagination and unleash your creativity. Whether it be fiction, poetry, or 
personal journaling, creative writing provides a platform for you to express yourself and connect 
with others. If you''re looking for a way to tap into your imagination and unleash your inner 
creativity, give creative writing a try!', 8, 0, 0, 'Creativity', "2"), 
('Maximizing Your Potential in School', 'Whether you''re just starting high school or are in your 
final year of university, it''s important to maximize your potential and make the most of your 
educational experience. With the right strategies, you can improve your grades, stay organized, 
and get the most out of your classes. In this post, we will discuss some tips and tricks for 
maximizing your potential in school.', 12, 5, 0, 'School', "3");


INSERT INTO comments (post_id, comment, likes, dislikes, commentUserId) VALUES 
(1, 'I''ve been practicing meditation for a few months now, and I''ve noticed a significant improvement in my 
stress levels. It''s amazing how just a few minutes of mindfulness can have such a profound impact.', 2, 0, "3"),
(1, 'I agree! Meditation has completely changed my life for the better.', 0, 6, "2"),
(1, 'I''ve always been curious about meditation, but I never knew where to start. 
Thanks for the information, I think I''ll give it a try.', 4, 1, "1"),
(2, 'I''ve always been interested in creative writing, but I never knew where to start. Thanks for the 
inspiration, I''m definitely going to give it a try!', 20, 166, "3"),
(2, 'I''ve been writing creatively for a few years now, and it''s such a liberating and therapeutic 
outlet for me. Thanks for reminding me of why I fell in love with it in the first place.', 10, 0, "2"),
(3, 'These tips are really helpful! I''ve been struggling with staying organized and keeping up with my 
school work, but I think implementing these strategies will make a big difference.', 3, 6, "1"),
(3, 'I''ve been out of school for a while now, but these tips are still so relevant. Thanks for this!', 1, 2, "3");

INSERT INTO users (userid, nickname, age, gender, firstname, lastname, email, passwd, staatus) VALUES
('1', 'test1', 1, 'male', 'te', 'st', 'test@test.com', 'test1', 'offline'),
('2', 'test2', 2, 'female', 'te', 'st', 'test2@test.com', 'test2', 'offline'),
('3', 'test3', 3, 'female', 'te', 'st', 'test3@test.com', 'test3', 'offline');