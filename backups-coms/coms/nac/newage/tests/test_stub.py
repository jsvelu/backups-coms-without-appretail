import django.test.testcases


class TestCase(django.test.TestCase):
    fixtures = ['initial', 'groups', 'users']

    @classmethod
    def setUpClass(cls):
        """ runs once per class """
        print('setUpClass')
        super(TestCase, cls).setUpClass()
        # setup tasks go here

    @classmethod
    def tearDownClass(cls):
        """ runs once per class """
        print('tearDownClass')
        # teardown tasks go here
        super(TestCase, cls).tearDownClass()

    @classmethod
    def setUpTestData(cls):
        """  runs per class if transaction support, otherwise per method """
        # "Modifications to in-memory objects from setup work done at the class level will persist between test methods"
        # I think this means that the DB doesn't change (transaction rollbacks) but references to the same object will be the same
        print(' setUpTestData')

    def setUp(self):
        """ runs once per method """
        print(' setUp')

    def tearDown(self):
        """ runs once per method """
        print(' tearDown')

    def test_foo(self):
        print('  I am a test case')
