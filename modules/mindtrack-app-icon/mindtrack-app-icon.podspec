Pod::Spec.new do |s|
  s.name           = 'MindTrackAppIcon'
  s.version        = '1.0.0'
  s.summary        = 'MindTrack alternate app icon bridge'
  s.description    = 'Offline native bridge for selecting bundled alternate icons.'
  s.license        = { :type => 'MIT' }
  s.author         = 'MindTrack'
  s.homepage       = 'https://localhost'
  s.platforms      = { :ios => '15.1' }
  s.swift_version  = '5.9'
  s.source         = { :git => '' }
  s.static_framework = true
  s.source_files   = 'ios/**/*.swift'
  s.dependency 'ExpoModulesCore'
end
