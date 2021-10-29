import time


class Snowflake:
    def __init__(self, init_serial_no=0):
        self.machine_id = 0
        self.epoch = 0
        self.serial_no = init_serial_no

    def generate(self):
        unique_id = (
            ((int(time.time() * 1000) - self.epoch) & 0x1FFFFFFFFFF) << 22
            | (self.machine_id & 0x3FF) << 12
            | (self.serial_no & 0xFFF)
        )
        self.serial_no += 1
        return unique_id
