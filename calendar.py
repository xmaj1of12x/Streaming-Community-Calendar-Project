import sys
import os
import urllib.request
from PyQt6.QtWidgets import QApplication, QMainWindow, QWidget, QGridLayout
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtCore import QUrl, QObject, pyqtSlot, pyqtSignal, QTimer
from PyQt6.QtGui import QDesktopServices
from PyQt6.QtWebChannel import QWebChannel

class Bridge(QObject):
    telemetryUpdated = pyqtSignal(str)

    @pyqtSlot(str)
    def openUrl(self, url_string):
        QDesktopServices.openUrl(QUrl(url_string))

class StandaloneCalendarWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Streaming Community Calendar")
        self.resize(1200, 820)
        
        central_widget = QWidget(self)
        self.setCentralWidget(central_widget)
        central_widget.setStyleSheet("background-color: #050b10;")
        
        grid = QGridLayout(central_widget)
        grid.setContentsMargins(20, 20, 20, 20)
        
        self.web_view = QWebEngineView()
        self.web_view.setStyleSheet("border: 1px solid #005577; border-radius: 4px; background-color: #121212;")
        
        self.channel = QWebChannel()
        self.bridge = Bridge()
        self.channel.registerObject("pyBridge", self.bridge)
        self.web_view.page().setWebChannel(self.channel)
        
        # Loads calendar_index.html from the local directory
        html_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "calendar_index.html")
        self.web_view.setUrl(QUrl.fromLocalFile(html_path))
        
        grid.addWidget(self.web_view, 0, 0)

        self.timer = QTimer(self)
        self.timer.timeout.connect(self.poll_telemetry)
        self.timer.start(5000)

    def poll_telemetry(self):
        try:
            req = urllib.request.Request("http://localhost:55565/api/status/all")
            with urllib.request.urlopen(req, timeout=2) as response:
                data = response.read().decode('utf-8')
                self.bridge.telemetryUpdated.emit(data)
        except Exception as e:
            pass

if __name__ == '__main__':
    app = QApplication(sys.argv)
    window = StandaloneCalendarWindow()
    window.show()
    sys.exit(app.exec())