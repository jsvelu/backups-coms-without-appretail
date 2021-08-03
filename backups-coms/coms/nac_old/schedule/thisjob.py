from schedule import * 
import schedule
import time
import threading
import Queue



def this_job():
	print('Passing Test !!! This job...!')

def run_threaded(job_func):
    job_thread = threading.Thread(target=job_func)
    job_thread.start()
# schedule.every(5).seconds.do(this_job)
schedule.every(5).seconds.do(run_threaded,this_job)
schedule.every(5).seconds.do(run_threaded, this_job)
schedule.every(5).seconds.do(run_threaded, this_job)
schedule.every(5).seconds.do(run_threaded, this_job)
schedule.every(5).seconds.do(run_threaded, this_job)
schedule.every(5).seconds.do(run_threaded, this_job)
schedule.every(5).seconds.do(run_threaded, this_job)

# schedule.every().hour.do(job)
# schedule.every().day.at("10:30").do(job)
# schedule.every().monday.do(job)
# schedule.every().wednesday.at("13:15").do(job)

while True:
    schedule.run_pending()
    time.sleep(1) 

