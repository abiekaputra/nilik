"""Module responsible for calibrating the local inspection artifact."""

from nilik.config import Settings
from nilik.vision.artifact import calibrate


def main() -> None:
    settings = Settings.local()
    settings.prepare()
    artifact = calibrate()
    artifact.save(settings.artifact_path)
    print(f"Saved {artifact.version} calibration to {settings.artifact_path}")


if __name__ == "__main__":
    main()
