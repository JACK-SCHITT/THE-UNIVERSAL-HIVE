/* RADIO AI — C hardware daemon
 * Listens on a named pipe. One byte in, one pin state out.
 * Fail-safe: start in RECEIVE (pin low). Any fault returns to RECEIVE.
 * MMIO is mocked. Wire the real register only on the bench you own.
 *
 *   T  isolate AM/FM/CB inputs (transmit request)
 *   R  restore receiver paths
 *   S  status byte on stdout
 *
 * Does not key a power amplifier. Coax isolation only.
 */

#include <errno.h>
#include <fcntl.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <sys/stat.h>
#include <unistd.h>

#define PIPE_PATH "/tmp/hive_rf_bridge"

static volatile sig_atomic_t run = 1;
static int relay_high = 0; /* 0 = receive, 1 = inputs isolated */

void set_relay_pin_high(void) {
    /* Direct MMIO register write to isolate receivers.
     * Replace with the board map. Do not key PA enable here. */
    relay_high = 1;
}

void set_relay_pin_low(void) {
    /* Restore idle path to the receivers. */
    relay_high = 0;
}

static void on_stop(int sig) {
    (void)sig;
    run = 0;
    set_relay_pin_low();
}

int main(void) {
    signal(SIGINT, on_stop);
    signal(SIGTERM, on_stop);

    set_relay_pin_low(); /* boot fail-safe */
    unlink(PIPE_PATH);
    if (mkfifo(PIPE_PATH, 0600) != 0) {
        perror("mkfifo");
        return 1;
    }

    fprintf(stderr, "RADIO daemon up %s state=RECEIVE\n", PIPE_PATH);

    while (run) {
        int fd = open(PIPE_PATH, O_RDONLY);
        if (fd < 0) {
            if (errno == EINTR) continue;
            perror("open");
            break;
        }
        char command = 0;
        ssize_t n;
        while (run && (n = read(fd, &command, 1)) > 0) {
            if (command == 'T') {
                set_relay_pin_high();
                fprintf(stderr, "isolate\n");
            } else if (command == 'R') {
                set_relay_pin_low();
                fprintf(stderr, "receive\n");
            } else if (command == 'S') {
                printf("%c\n", relay_high ? 'T' : 'R');
                fflush(stdout);
            }
        }
        close(fd);
    }

    set_relay_pin_low();
    unlink(PIPE_PATH);
    fprintf(stderr, "RADIO daemon down state=RECEIVE\n");
    return 0;
}
