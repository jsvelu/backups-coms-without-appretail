from schedule import * 
import schedule
import time


def this_job(request):
	print('Passing Test !!! This job...!')
# schedule.every(5).seconds.do(job)
schedule.every(10).seconds.do(this_job)
# schedule.every().hour.do(job)
# schedule.every().day.at("10:30").do(job)
# schedule.every().monday.do(job)
# schedule.every().wednesday.at("13:15").do(job)

while True:
    schedule.run_pending()
    time.sleep(5) 

