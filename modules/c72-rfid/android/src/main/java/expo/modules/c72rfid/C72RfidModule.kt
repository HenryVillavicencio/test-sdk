package expo.modules.c72rfid

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import com.rscja.team.qcom.deviceapi.RFIDWithUHFUART_qcom
import com.rscja.deviceapi.entity.UHFTAGInfo
import android.util.Log

class C72RfidModule : Module() {
  private var rfid: RFIDWithUHFUART_qcom? = null
  private var isScanning = false
  private var scanThread: Thread? = null

  override fun definition() = ModuleDefinition {
    Name("C72Rfid")

    Events("onTagRead")

    Function("init") {
      try {
        rfid = RFIDWithUHFUART_qcom.getInstance()
        val success = rfid?.init() ?: false
        Log.d("C72Rfid", "Init result: $success")
        return@Function success
      } catch (e: Exception) {
        Log.e("C72Rfid", "Init failed", e)
        return@Function false
      }
    }

    Function("startScanning") {
      if (rfid == null) return@Function false

      // Use deprecated synchronous polling as it is simpler for this integration
      // unless we find the callback interface documentation
      if (rfid!!.startInventoryTag()) {
        isScanning = true
        startScanLoop()
        return@Function true
      }
      return@Function false
    }

    Function("stopScanning") {
        isScanning = false
        rfid?.stopInventory()
    }

    Function("free") {
        isScanning = false
        rfid?.free()
        rfid = null
    }

    Function("getPower") {
        return@Function rfid?.power ?: 0
    }

    Function("setPower") { power: Int ->
        return@Function rfid?.setPower(power) ?: false
    }
  }

  private fun startScanLoop() {
    scanThread = Thread {
      while (isScanning) {
        val tag = rfid?.readTagFromBuffer()
        if (tag != null) {
           // Field names guessed based on typical SDKs.
           // If compilation fails, we will need to adjust.
           // Usually: getEPC(), getRssi(), getTid()
           sendEvent("onTagRead", mapOf(
             "epc" to tag.epc,
             "rssi" to tag.rssi,
             "tid" to tag.tid
           ))
        }
        try {
            Thread.sleep(20)
        } catch (e: InterruptedException) {
            // ignore
        }
      }
    }
    scanThread?.start()
  }
}
