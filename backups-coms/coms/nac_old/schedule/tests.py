from datetime import date

from django.test.testcases import SimpleTestCase

from .models import Capacity


class ScheduleTestCase(SimpleTestCase):
    def setUp(self):
        pass

    def test_working_day_calculation(self):
        """Verify working day calculations"""
        capacities_data = {
            date(2001, 1,  1): 0,
            date(2001, 1,  2): 0,
            date(2001, 1,  3): 1,
            date(2001, 1,  4): 0,
            date(2001, 1,  5): 1,
            date(2001, 1,  6): 0,
            date(2001, 1,  7): 0,
            date(2001, 1,  8): 1,
            date(2001, 1,  9): 1,
            date(2001, 1, 10): 1,
            date(2001, 1, 11): 1,
            date(2001, 1, 12): 1,
            date(2001, 1, 13): 1,
            date(2001, 1, 14): 0,
            date(2001, 1, 15): 1,
        }
        # turn those values into something that looks like a Capacity object
        capacities = dict()
        for key, value in list(capacities_data.items()):
            capacities[key] = Capacity(
                day=key,
                capacity=value,
                type=Capacity.CAPACITY_TYPE_OPEN if value > 0 else Capacity.CAPACITY_TYPE_CLOSED
            )

        tests = [
            # start on an open day
            (date(2001, 1, 11), -99, None),
            (date(2001, 1, 11),  -6, None),
            (date(2001, 1, 11),  -5, date(2001, 1,  3)),
            (date(2001, 1, 11),  -4, date(2001, 1,  5)),
            (date(2001, 1, 11),  -3, date(2001, 1,  8)),
            (date(2001, 1, 11),  -2, date(2001, 1,  9)),
            (date(2001, 1, 11),  -1, date(2001, 1, 10)),
            (date(2001, 1, 11),   0, date(2001, 1, 11)),
            (date(2001, 1, 11),  +1, date(2001, 1, 12)),
            (date(2001, 1, 11),  +2, date(2001, 1, 13)),
            (date(2001, 1, 11),  +3, date(2001, 1, 15)),
            (date(2001, 1, 11),  +4, None),
            (date(2001, 1, 11), +99, None),

            # and try the same with a closed day
            (date(2001, 1, 7), -3, None),
            (date(2001, 1, 7), -2, date(2001, 1,  3)),
            (date(2001, 1, 7), -1, date(2001, 1,  5)),
            #(date(2001, 1, 7), 0, ), # behaviour undefined
            (date(2001, 1, 7), +1, date(2001, 1,  8)),
            (date(2001, 1, 7), +7, date(2001, 1, 15)),
            (date(2001, 1, 7), +8, None),
        ]

        for start_date, offset, expected in tests:
            #print start_date, offset, expected
            self.assertEqual(Capacity.get_working_day_relative(start_date, offset, capacities), expected)
