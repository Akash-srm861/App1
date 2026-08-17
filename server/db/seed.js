const bcrypt = require('bcryptjs');
const { db, initSchema } = require('./database');
const config = require('../config/config');

function seedDatabase() {
  initSchema();

  // 1. Seed Admin User if not exists
  const existingAdmin = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
  if (!existingAdmin) {
    const adminPasswordHash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', adminPasswordHash, 'admin');
    console.log('Seeded default admin user (admin / admin123)');
  }

  // 2. Seed Event Settings
  const defaultSettings = [
    { key: 'event_name', value: 'CODE THE OUTPUT' },
    { key: 'duration', value: config.DEFAULT_DURATION_SECONDS.toString() }
  ];

  const insertSetting = db.prepare('INSERT OR IGNORE INTO event_settings (key, value) VALUES (?, ?)');
  for (const setting of defaultSettings) {
    insertSetting.run(setting.key, setting.value);
  }

  // 3. Seed 15 Questions if table is empty
  const questionCount = db.prepare('SELECT COUNT(*) as count FROM questions').get().count;
  if (questionCount === 0) {
    const questionsData = [
      {
        title: 'Star Pattern Printing',
        description: 'Print a right-angled star pattern using the given number of rows N.',
        input: '5',
        expected_output: '*\n**\n***\n****\n*****',
        allowed_languages: 'python,c,cpp,java,javascript'
      },
      {
        title: 'Second Largest Element',
        description: 'Find and print the second largest distinct element in an integer array. The first line contains N, and the second line contains N space-separated integers.',
        input: '5\n10 5 8 20 15',
        expected_output: '15',
        allowed_languages: 'python,c,cpp,java,javascript'
      },
      {
        title: 'Reverse Words in a Sentence',
        description: 'Reverse the order of words in a given space-separated sentence and print the result.',
        input: 'Hello World Coding',
        expected_output: 'Coding World Hello',
        allowed_languages: 'python,c,cpp,java,javascript'
      },
      {
        title: 'Prime Number Checker',
        description: 'Check if a given integer N is prime. Print "PRIME" if it is prime, otherwise print "NOT PRIME".',
        input: '29',
        expected_output: 'PRIME',
        allowed_languages: 'python,c,cpp,java,javascript'
      },
      {
        title: 'Fibonacci Series Sum',
        description: 'Calculate and print the sum of the first N Fibonacci numbers starting from 0 (0, 1, 1, 2, 3, 5...).',
        input: '6',
        expected_output: '12',
        allowed_languages: 'python,c,cpp,java,javascript'
      },
      {
        title: 'Palindrome String',
        description: 'Determine whether a given lowercase string is a palindrome. Print "PALINDROME" if true, else "NOT PALINDROME".',
        input: 'racecar',
        expected_output: 'PALINDROME',
        allowed_languages: 'python,c,cpp,java,javascript'
      },
      {
        title: 'Array Left Rotation',
        description: 'Left rotate an array of N integers by K positions. The first line contains N and K. The second line contains N space-separated integers.',
        input: '5 2\n1 2 3 4 5',
        expected_output: '3 4 5 1 2',
        allowed_languages: 'python,c,cpp,java,javascript'
      },
      {
        title: 'Count Vowels and Consonants',
        description: 'Count the number of vowels and consonants in a given sentence (ignore spaces). Print in format "Vowels: X, Consonants: Y".',
        input: 'Code The Output',
        expected_output: 'Vowels: 6, Consonants: 7',
        allowed_languages: 'python,c,cpp,java,javascript'
      },
      {
        title: 'Sum of Digits Single Digit',
        description: 'Continuously sum the digits of a non-negative integer until the result has only one digit, and print it.',
        input: '9875',
        expected_output: '2',
        allowed_languages: 'python,c,cpp,java,javascript'
      },
      {
        title: 'Find Missing Number',
        description: 'Given N integers from 1 to N+1 with one number missing, find and print the missing number. First line contains N, second line contains N space-separated integers.',
        input: '5\n1 2 4 5 6',
        expected_output: '3',
        allowed_languages: 'python,c,cpp,java,javascript'
      },
      {
        title: 'Anagram Check',
        description: 'Given two space-separated lowercase words, check if they are anagrams of each other. Print "ANAGRAM" or "NOT ANAGRAM".',
        input: 'listen silent',
        expected_output: 'ANAGRAM',
        allowed_languages: 'python,c,cpp,java,javascript'
      },
      {
        title: 'Matrix Transpose',
        description: 'Print the transpose of an M x N matrix. First line contains M and N. The next M lines contain N space-separated integers.',
        input: '2 3\n1 2 3\n4 5 6',
        expected_output: '1 4\n2 5\n3 6',
        allowed_languages: 'python,c,cpp,java,javascript'
      },
      {
        title: 'Longest Word in String',
        description: 'Find and print the longest word in a given sentence. If multiple words have equal max length, print the first one.',
        input: 'Keep learning and keep growing',
        expected_output: 'learning',
        allowed_languages: 'python,c,cpp,java,javascript'
      },
      {
        title: 'Factorial Calculation',
        description: 'Compute and print the factorial of a non-negative integer N.',
        input: '6',
        expected_output: '720',
        allowed_languages: 'python,c,cpp,java,javascript'
      },
      {
        title: 'Check Armstrong Number',
        description: 'Check if an N-digit number is an Armstrong number. Print "ARMSTRONG" or "NOT ARMSTRONG".',
        input: '153',
        expected_output: 'ARMSTRONG',
        allowed_languages: 'python,c,cpp,java,javascript'
      }
    ];

    const insertQ = db.prepare(`
      INSERT INTO questions (title, description, input, expected_output, allowed_languages)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const q of questionsData) {
      insertQ.run(q.title, q.description, q.input, q.expected_output, q.allowed_languages);
    }
    console.log('Seeded 15 coding questions (Q01 to Q15)');
  }

  // 4. Seed 15 Teams if table is empty
  const teamCount = db.prepare('SELECT COUNT(*) as count FROM teams').get().count;
  if (teamCount === 0) {
    const questionsList = db.prepare('SELECT id FROM questions ORDER BY id ASC').all();
    const insertTeam = db.prepare(`
      INSERT INTO teams (name, password, question_id, status)
      VALUES (?, ?, ?, 'NOT_STARTED')
    `);

    for (let i = 1; i <= 15; i++) {
      const teamNum = i < 10 ? `0${i}` : `${i}`;
      const teamName = `TEAM${teamNum}`;
      const plainPassword = `TEAM${teamNum}@123`;
      const passwordHash = bcrypt.hashSync(plainPassword, 10);
      const questionId = questionsList[i - 1] ? questionsList[i - 1].id : null;

      insertTeam.run(teamName, passwordHash, questionId);
    }
    console.log('Seeded 15 default teams (TEAM01 to TEAM15) with assigned questions');
  }

  // 5. Seed Test Cases if test_cases table is empty
  const testCaseCount = db.prepare('SELECT COUNT(*) as count FROM test_cases').get().count;
  if (testCaseCount === 0) {
    const questions = db.prepare('SELECT id, title, input, expected_output FROM questions ORDER BY id ASC').all();
    const insertTestCase = db.prepare(`
      INSERT INTO test_cases (question_id, input, expected_output, is_hidden)
      VALUES (?, ?, ?, 1)
    `);

    for (const q of questions) {
      if (q.id === 1 || q.title.includes('Star Pattern')) {
        // Q01 Star Pattern - exact 4 test cases specified in problem prompt
        insertTestCase.run(q.id, '3', '*\n**\n***');
        insertTestCase.run(q.id, '5', '*\n**\n***\n****\n*****');
        insertTestCase.run(q.id, '7', '*\n**\n***\n****\n*****\n******\n*******');
        insertTestCase.run(q.id, '10', '*\n**\n***\n****\n*****\n******\n*******\n********\n*********\n**********');
      } else if (q.id === 2 || q.title.includes('Second Largest')) {
        insertTestCase.run(q.id, '5\n10 5 8 20 15', '15');
        insertTestCase.run(q.id, '4\n1 2 3 4', '3');
        insertTestCase.run(q.id, '6\n100 200 500 400 300 500', '400');
      } else if (q.id === 3 || q.title.includes('Reverse Words')) {
        insertTestCase.run(q.id, 'Hello World Coding', 'Coding World Hello');
        insertTestCase.run(q.id, 'Python is awesome', 'awesome is Python');
        insertTestCase.run(q.id, 'Code', 'Code');
      } else if (q.id === 4 || q.title.includes('Prime Number')) {
        insertTestCase.run(q.id, '29', 'PRIME');
        insertTestCase.run(q.id, '15', 'NOT PRIME');
        insertTestCase.run(q.id, '2', 'PRIME');
        insertTestCase.run(q.id, '1', 'NOT PRIME');
      } else if (q.id === 5 || q.title.includes('Fibonacci')) {
        insertTestCase.run(q.id, '6', '12');
        insertTestCase.run(q.id, '5', '7');
        insertTestCase.run(q.id, '1', '0');
      } else if (q.id === 6 || q.title.includes('Palindrome')) {
        insertTestCase.run(q.id, 'racecar', 'PALINDROME');
        insertTestCase.run(q.id, 'hello', 'NOT PALINDROME');
        insertTestCase.run(q.id, 'madam', 'PALINDROME');
      } else if (q.id === 7 || q.title.includes('Left Rotation')) {
        insertTestCase.run(q.id, '5 2\n1 2 3 4 5', '3 4 5 1 2');
        insertTestCase.run(q.id, '4 1\n10 20 30 40', '20 30 40 10');
      } else if (q.id === 8 || q.title.includes('Vowels and Consonants')) {
        insertTestCase.run(q.id, 'Code The Output', 'Vowels: 6, Consonants: 7');
        insertTestCase.run(q.id, 'Hello', 'Vowels: 2, Consonants: 3');
      } else if (q.id === 9 || q.title.includes('Single Digit')) {
        insertTestCase.run(q.id, '9875', '2');
        insertTestCase.run(q.id, '1234', '1');
      } else if (q.id === 10 || q.title.includes('Missing Number')) {
        insertTestCase.run(q.id, '5\n1 2 4 5 6', '3');
        insertTestCase.run(q.id, '3\n1 2 3 5', '4');
      } else if (q.id === 11 || q.title.includes('Anagram')) {
        insertTestCase.run(q.id, 'listen silent', 'ANAGRAM');
        insertTestCase.run(q.id, 'hello world', 'NOT ANAGRAM');
      } else if (q.id === 12 || q.title.includes('Matrix Transpose')) {
        insertTestCase.run(q.id, '2 3\n1 2 3\n4 5 6', '1 4\n2 5\n3 6');
        insertTestCase.run(q.id, '2 2\n1 2\n3 4', '1 3\n2 4');
      } else if (q.id === 13 || q.title.includes('Longest Word')) {
        insertTestCase.run(q.id, 'Keep learning and keep growing', 'learning');
        insertTestCase.run(q.id, 'Web Development', 'Development');
      } else if (q.id === 14 || q.title.includes('Factorial')) {
        insertTestCase.run(q.id, '6', '720');
        insertTestCase.run(q.id, '5', '120');
        insertTestCase.run(q.id, '0', '1');
      } else if (q.id === 15 || q.title.includes('Armstrong')) {
        insertTestCase.run(q.id, '153', 'ARMSTRONG');
        insertTestCase.run(q.id, '123', 'NOT ARMSTRONG');
        insertTestCase.run(q.id, '371', 'ARMSTRONG');
      } else {
        insertTestCase.run(q.id, q.input || '', q.expected_output);
      }
    }
    console.log('Seeded test cases for questions (including Q01 4 test cases)');
  }
}

module.exports = { seedDatabase };
